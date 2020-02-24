import { Transaction } from 'sequelize'
import util from 'util'
import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx-utils/logging'
import { OnChainCurrencyGateway, CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { WithdrawalRequest, WithdrawalState, CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'
import { updateWithdrawalRequest } from '../../lib'
import { CryptoWithdrawalGatekeeper } from '../withdrawals_gatekeeper'
import { withdrawFundsFromHoldingsAccountToTargetAddress } from './crypto_funds_transferrer'
import { denyPendingDeposit } from '@abx-service-clients/balance'

const logger = Logger.getInstance('crypto_withdrawal_transfer_handler', 'transferCryptoForLatestWithdrawalRequest')
const secondsToWaitBeforeTriggeringCompletionLogic = 60
const secondsToWaitBeforeReattemptingHoldingsTransfer = 30

export async function transferCryptoForLatestWithdrawalRequest(
  currencyCode: CurrencyCode,
  manager: CurrencyManager,
  pendingHoldingsAccountTransferGatekeeper: CryptoWithdrawalGatekeeper,
  pendingCompletionGatekeeper: CryptoWithdrawalGatekeeper,
) {
  const latestRequestPendingHoldingsTransfer = pendingHoldingsAccountTransferGatekeeper.getLatestWithdrawalForCurrency(currencyCode)

  if (!latestRequestPendingHoldingsTransfer) {
    return
  }

  const { withdrawalRequest, feeRequest } = latestRequestPendingHoldingsTransfer

  return wrapInTransaction(sequelize, null, async transaction => {
    try {
      const onChainCurrencyGateway = manager.getCurrencyFromTicker(currencyCode)

      // TODO add check here to make sure funds have not been transferred already (if previous request "failed")
      const { txHash, transactionFee } = await withdrawFundsFromHoldingsAccountToTargetAddress(withdrawalRequest, onChainCurrencyGateway)
      logger.info(
        `Created withdrawal transaction for withdrawal request ${withdrawalRequest.id} with transaction hash ${txHash} and fee ${transactionFee}`,
      )

      await deductOnChainTransactionFeeFromRevenueBalance(
        withdrawalRequest,
        transactionFee,
        onChainCurrencyGateway,
        !!feeRequest ? feeRequest.currencyId : withdrawalRequest.currencyId,
      )

      const [updatedWithdrawalRequest, updatedFeeRequest] = await updateRequestStatuses(
        withdrawalRequest,
        txHash,
        transactionFee,
        transaction,
        feeRequest,
      )

      updateRequestInGatekeepers(
        updatedWithdrawalRequest!,
        pendingHoldingsAccountTransferGatekeeper,
        pendingCompletionGatekeeper,
        shouldAddToCompletionGatekeeper(onChainCurrencyGateway),
        updatedFeeRequest || undefined,
      )
    } catch (error) {
      logger.error(
        `Error Requesting Crypto Withdrawal for ${withdrawalRequest.amount}: ${withdrawalRequest.currency.code}, for account: ${withdrawalRequest.accountId}`,
      )
      logger.error(JSON.stringify(util.inspect(error)))

      pendingHoldingsAccountTransferGatekeeper.removeRequest(currencyCode, withdrawalRequest.id!)
      pendingHoldingsAccountTransferGatekeeper.addNewWithdrawalRequestForCurrency(
        currencyCode,
        { withdrawalRequest, feeRequest },
        secondsToWaitBeforeReattemptingHoldingsTransfer,
      )
    }
  })
}

const currencyToCoverOnChainFeeFor = [CurrencyCode.ethereum, CurrencyCode.kvt]

/**
 * Prior to transferring the funds we reserve the total withdrawal amount
 * from the user balance and increase the pending deposit currency balance for the kinesis revenue account
 * by the withdrawal fee (based on the currency). This step here is to make sure we deduct the on-chain transaction fee
 * from the fee amount we have already allocated in the kinesis revenue account.
 */
export async function deductOnChainTransactionFeeFromRevenueBalance(
  { id: withdrawalId }: WithdrawalRequest,
  transactionFee: number,
  currencyGateway: OnChainCurrencyGateway,
  feeCurrencyId: number,
) {
  if (currencyToCoverOnChainFeeFor.includes(currencyGateway.ticker!)) {
    const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()

    await denyPendingDeposit({
      accountId: kinesisRevenueAccount.id,
      amount: transactionFee,
      currencyId: feeCurrencyId,
      sourceEventId: withdrawalId!,
      sourceEventType: SourceEventType.currencyWithdrawal,
    })

    logger.info(
      `A ${transactionFee} on chain fee has been paid for withdrawal request ${withdrawalId} and deducted from revenue balance for currency ${feeCurrencyId}`,
    )
  }
}

async function updateRequestStatuses(
  withdrawalRequest: CurrencyEnrichedWithdrawalRequest,
  withdrawalTransactionHash: string,
  onChainTransactionFee: number,
  transaction: Transaction,
  feeRequest?: CurrencyEnrichedWithdrawalRequest | null,
) {
  return Promise.all([
    updateWithdrawalRequest(
      {
        id: withdrawalRequest.id,
        txHash: withdrawalTransactionHash,
        kinesisCoveredOnChainFee: currencyToCoverOnChainFeeFor.includes(withdrawalRequest.currency.code) ? onChainTransactionFee : 0,
        state: WithdrawalState.holdingsTransactionCompleted,
      },
      transaction,
    ).then(updatedWithdrawalRequest => ({
      ...updatedWithdrawalRequest,
      currency: withdrawalRequest.currency,
    })),
    !!feeRequest
      ? updateWithdrawalRequest(
          {
            id: feeRequest.id,
            state: WithdrawalState.holdingsTransactionCompleted,
          },
          transaction,
        ).then(updatedFeeRequest => ({ ...updatedFeeRequest, currency: feeRequest.currency }))
      : Promise.resolve(null),
  ])
}

function updateRequestInGatekeepers(
  updatedWithdrawalRequest: CurrencyEnrichedWithdrawalRequest,
  pendingHoldingsAccountTransferGatekeeper: CryptoWithdrawalGatekeeper,
  pendingCompletionGatekeeper: CryptoWithdrawalGatekeeper,
  addToCompletionGatekeeper: boolean,
  feeRequest?: CurrencyEnrichedWithdrawalRequest,
) {
  pendingHoldingsAccountTransferGatekeeper.removeRequest(updatedWithdrawalRequest.currency.code, updatedWithdrawalRequest.id!)
  if (addToCompletionGatekeeper) {
    pendingCompletionGatekeeper.addNewWithdrawalRequestForCurrency(
      updatedWithdrawalRequest.currency.code,
      { withdrawalRequest: updatedWithdrawalRequest, feeRequest },
      secondsToWaitBeforeTriggeringCompletionLogic,
    )
  }
}

/**
 * This function is used to check if we add the withdrawal request to the completion gatekeeper.
 * Reasons for not adding it are:
 * 1. Webhooks from third parties will confirm the transaction and then add it to the completion gatekeeper
 * @param currencyGateway
 */
function shouldAddToCompletionGatekeeper(currencyGateway: OnChainCurrencyGateway) {
  return currencyGateway.kinesisManagesConfirmations()
}
