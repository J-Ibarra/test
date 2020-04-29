import { Logger } from '@abx-utils/logging'
import { CurrencyManager, OnChainCurrencyGateway, EndpointInvocationUtils } from '@abx-utils/blockchain-currency-gateway'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { findMostRecentlyUpdatedDepositRequest, updateDepositRequest } from '../../../../../core'
import { DepositGatekeeper } from '../..'
import { handlerDepositError } from './pending_holdings_transaction_deposit_error_handler'
import { decryptValue } from '@abx-utils/encryption'

const logger = Logger.getInstance(
  'pending_holdings_transaction_deposit_request_processor', 
  'processPendingHoldingsTransactionDepositRequestsForCurrency'
)

export async function processPendingHoldingsTransactionDepositRequestsForCurrency(
  completedPendingHoldingsTransactionGatekeeper: DepositGatekeeper,
  pendingHoldingsTransactionConfirmationGatekeeper: DepositGatekeeper,
  currency: CurrencyCode,
  onChainCurrencyManager: CurrencyManager,
) {
  const depositRequest = completedPendingHoldingsTransactionGatekeeper.getNewestDepositForCurrency(currency)

  if (!depositRequest) {
    return
  }

  try {
    const updatedRequest = await transferAmountIntoHoldingsAndUpdateDepositRequest(depositRequest, onChainCurrencyManager)

    logger.debug(`Pending holdings transfer for currency ${currency} and deposit ${depositRequest.id} completed successfully`)
    completedPendingHoldingsTransactionGatekeeper.removeRequest(currency, depositRequest.id!)
    pendingHoldingsTransactionConfirmationGatekeeper.addNewDepositsForCurrency(currency, [updatedRequest])
  } catch (e) {
    await handlerDepositError(e, currency, depositRequest, completedPendingHoldingsTransactionGatekeeper)
  }
}

async function transferAmountIntoHoldingsAndUpdateDepositRequest(
  depositRequest: DepositRequest,
  manager: CurrencyManager,
) {
  return wrapInTransaction(sequelize, null, async (transaction) => {
    const currency = await manager.getCurrencyFromId(depositRequest.depositAddress.currencyId)
    logger.info(
      `Transferring ${depositRequest.amount} ${currency.ticker} from address: ${depositRequest.depositAddress.publicKey} to the Exchange Holdings`,
    )
    const { txHash, transactionFee } = await transferDepositAmountToExchangeHoldings(currency, depositRequest)

    logger.info(
      `Successfully transferred ${depositRequest.amount} ${currency.ticker} from address: ${depositRequest.depositAddress.publicKey} to the Exchange Holdings`,
    )

    const updatedRequest = await updateDepositRequest(
      depositRequest.id!,
      {
        holdingsTxHash: txHash,
        status: DepositRequestStatus.pendingHoldingsTransactionConfirmation,
        holdingsTxFee: Number(transactionFee),
      },
      transaction,
    )

    return { ...updatedRequest, depositAddress: depositRequest.depositAddress }
  })
}

/**
 * There is a situation where there can be a kinesis currency deposit request still to be processed but the balance at the address is now 0 due to the `merge_account` operation. So:
 * * we assume we have already merged it with the most recent deposit request for this address so we find this previous deposit
 * * then we return that deposit's transaction hash to mark it as having been completed as part of it.
 */
async function transferDepositAmountToExchangeHoldings(currency: OnChainCurrencyGateway, confirmedRequest: DepositRequest) {
  const balanceAtAddress = await EndpointInvocationUtils.invokeEndpointWithProgressiveRetryAndResultAssert({
    name: 'balanceAt',
    endpointInvoker: () => currency.balanceAt(confirmedRequest.depositAddress.publicKey),
    resultPredicate: (balanceAtAddress) => balanceAtAddress !== 0,
  })

  if (balanceAtAddress === 0) {
    logger.info(
      `Unable to retrieve balance at deposit address: ${confirmedRequest.depositAddress.publicKey}, will use an older holdings transaction hash`,
    )

    const previouslyCompletedRequestForTheSameAddress = await findMostRecentlyUpdatedDepositRequest({
      depositAddressId: confirmedRequest.depositAddressId,
      status: DepositRequestStatus.completed,
    })

    if (!previouslyCompletedRequestForTheSameAddress) {
      logger.error(`Unable to find a previously completed deposit for address ${confirmedRequest.depositAddressId}`)

      throw new Error(`Previously completed deposit for address ${confirmedRequest.depositAddressId} not found`)
    }

    return {
      txHash: previouslyCompletedRequestForTheSameAddress.holdingsTxHash,
      transactionFee: 0,
    }
  }

  const decryptedPrivateKey = await decryptValue(confirmedRequest.depositAddress.encryptedPrivateKey)
  logger.info(`Decrypted private key for address: ${confirmedRequest.depositAddress.publicKey}`)

  return currency.transferToExchangeHoldingsFrom({ privateKey: decryptedPrivateKey! }, confirmedRequest.amount)
}
