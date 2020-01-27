import util from 'util'

import { isAccountSuspended, findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager, OnChainCurrencyGateway } from '@abx-query-libs/blockchain-currency-gateway'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { findMostRecentlyUpdatedDepositRequest, updateDepositRequest } from '../../../../../core'
import { DepositGatekeeper } from '../deposit_gatekeeper'
import { handlerDepositError } from './new_deposit_error_handler'
import { createPendingDeposit, createPendingWithdrawal } from '@abx-service-clients/balance'
import { decryptValue } from '@abx-utils/encryption'
import { getCurrencyId } from '@abx-service-clients/reference-data'

const logger = Logger.getInstance('deposit_request_processor', 'processNewestDepositRequestForCurrency')

const currencyToCurrentlyProcessingFlag: Map<CurrencyCode, boolean> = new Map()
const currencyCodeToIdLocalCache = new Map<CurrencyCode, number>()

export async function processNewestDepositRequestForCurrency(
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
  pendingCompletionGatekeeper: DepositGatekeeper,
  suspendedAccountDepositGatekeeper: DepositGatekeeper,
  currency: CurrencyCode,
  onChainCurrencyManager: CurrencyManager,
) {
  const depositRequest = pendingHoldingsTransferGatekeeper.getNewestDepositForCurrency(currency)

  if (!depositRequest) {
    return
  }
  currencyToCurrentlyProcessingFlag.set(currency, true)

  const depositTransactionConfirmed = await checkTransactionConfirmation(currency, depositRequest, onChainCurrencyManager)
  if (!depositTransactionConfirmed) {
    logger.warn(`Attempted to process request ${depositRequest.id} where the transaction is not yet confirmed`)

    return pendingHoldingsTransferGatekeeper.unlockRequest(currency, depositRequest.id!)
  }
  logger.info(`Deposit transaction for request ${depositRequest.id} confirmed`)

  try {
    const accountIsSuspended = await isAccountSuspended(depositRequest.depositAddress.accountId)

    if (accountIsSuspended) {
      return addToSuspendedAccountGatekeeper(currency, depositRequest, pendingCompletionGatekeeper, suspendedAccountDepositGatekeeper)
    }

    const updatedRequest = await transferAmountIntoHoldingsAndUpdateDepositRequest(depositRequest, currency, onChainCurrencyManager)

    logger.debug(`Pending holdings transfer for currency ${currency} and deposit ${depositRequest.id} completed successfully`)
    pendingHoldingsTransferGatekeeper.removeRequest(currency, depositRequest.id!)
    pendingCompletionGatekeeper.addNewDepositsForCurrency(currency, [updatedRequest])
  } catch (e) {
    await handlerDepositError(e, currency, depositRequest, pendingHoldingsTransferGatekeeper)
  } finally {
    currencyToCurrentlyProcessingFlag.set(currency, false)
  }
}

async function checkTransactionConfirmation(currency: CurrencyCode, depositRequest: DepositRequest, onChainCurrencyManager: CurrencyManager) {
  const onChainGateway = onChainCurrencyManager.getCurrencyFromTicker(currency)

  try {
    const depositTransactionConfirmed = await onChainGateway.checkConfirmationOfTransaction(depositRequest.depositTxHash)

    return depositTransactionConfirmed
  } catch (e) {
    logger.error(`Error encountered while checking confirmation of deposit transaction ${depositRequest.depositTxHash}`)
    logger.error(JSON.stringify(util.inspect(e)))
  }
}

async function transferAmountIntoHoldingsAndUpdateDepositRequest(
  depositRequest: DepositRequest,
  currencyCode: CurrencyCode,
  manager: CurrencyManager,
) {
  return wrapInTransaction(sequelize, null, async transaction => {
    await createPendingDeposit({
      accountId: depositRequest.depositAddress.accountId,
      amount: depositRequest.amount,
      currencyId: depositRequest.depositAddress.currencyId,
      sourceEventId: depositRequest.id!,
      sourceEventType: SourceEventType.currencyDepositRequest,
    })

    const currency = await manager.getCurrencyFromId(depositRequest.depositAddress.currencyId)
    logger.info(
      `Transferring ${depositRequest.amount} ${currency.ticker} from address:  ${depositRequest.depositAddress.publicKey} to the Exchange Holdings`,
    )
    const { txHash, transactionFee } = await transferDepositAmountToExchangeHoldings(currency, depositRequest)

    logger.info(
      `Successfully transferred ${depositRequest.amount} ${currency.ticker} from address:  ${depositRequest.depositAddress.publicKey} to the Exchange Holdings`,
    )

    const updatedRequest = await updateDepositRequest(
      depositRequest.id!,
      {
        holdingsTxHash: txHash,
        status: DepositRequestStatus.pendingCompletion,
        holdingsTxFee: Number(transactionFee),
      },
      transaction,
    )

    if (currencyToCoverOnChainFeeFor.includes(currencyCode)) {
      const currencyToPayDepositFeeIn = await getDepositFeeCurrencyId(currency.ticker!)
      await createKinesisRevenueFeeWithdrawal(depositRequest, Number(transactionFee), currencyToPayDepositFeeIn)
    }

    return { ...updatedRequest, depositAddress: depositRequest.depositAddress }
  })
}

const kinesisCurrencies = [CurrencyCode.kag, CurrencyCode.kau]

/**
 * There is a situation where there can be a kinesis currency deposit request still to be processed but the balance at the address is now 0 due to the `merge_account` operation. So:
 * * we assume we have already merged it with the most recent deposit request for this address so we find this previous deposit
 * * then we return that deposit's transaction hash to mark it as having been completed as part of it.
 */
async function transferDepositAmountToExchangeHoldings(currency: OnChainCurrencyGateway, confirmedRequest: DepositRequest) {
  const balanceAtAddress = await currency.balanceAt(confirmedRequest.depositAddress.publicKey)

  if (balanceAtAddress === 0 && kinesisCurrencies.includes(currency.ticker!)) {
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

  return currency.transferToExchangeHoldingsFrom(decryptedPrivateKey!, confirmedRequest.amount)
}

export async function createKinesisRevenueFeeWithdrawal({ id: depositId }: DepositRequest, transactionFee: number, currencyId: number) {
  const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()

  await createPendingWithdrawal({
    pendingWithdrawalParams: {
      accountId: kinesisRevenueAccount.id,
      amount: transactionFee,
      currencyId,
      sourceEventId: depositId!,
      sourceEventType: SourceEventType.currencyDeposit,
    },
  })

  logger.info(
    `A ${transactionFee} on chain fee has been paid for deposit request ${depositId} and deducted from revenue balance for currency ${currencyId}`,
  )
}

const currencyToCoverOnChainFeeFor = [CurrencyCode.ethereum, CurrencyCode.kvt]

export async function getDepositFeeCurrencyId(currency: CurrencyCode) {
  if (currency === CurrencyCode.kvt) {
    const kvtId = currencyCodeToIdLocalCache.get(currency) || (await getCurrencyId(CurrencyCode.ethereum))
    currencyCodeToIdLocalCache.set(currency, kvtId)

    return kvtId
  }

  const feeCurrencyId = currencyCodeToIdLocalCache.get(currency) || (await getCurrencyId(currency))
  currencyCodeToIdLocalCache.set(currency, feeCurrencyId)

  return feeCurrencyId
}

function addToSuspendedAccountGatekeeper(currency, depositRequest, pendingHoldingsTransferGatekeeper, suspendedAccountDepositGatekeeper) {
  logger.warn(`Attempted to process request ${depositRequest.id} which the relevant account is suspended`)
  pendingHoldingsTransferGatekeeper.removeRequest(currency, depositRequest.id)
  suspendedAccountDepositGatekeeper.addNewDepositsForCurrency(currency, [depositRequest])
}
