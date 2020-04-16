import { WithdrawalCompletionPendingPayload } from './model'
import { getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { findAllCurrencyCodes, findCurrencyForCode } from '@abx-service-clients/reference-data'
import { Environment, SymbolPairStateFilter, CurrencyCode } from '@abx-types/reference-data'
import { findWithdrawalRequestByTxHashWithFeeRequest, findWithdrawalRequests } from '../../../../core'
import { completeCryptoWithdrawal } from './crypto'
import { Logger } from '@abx-utils/logging'
import { nativelyImplementedCoins } from '../common'
import { WithdrawalState } from '@abx-types/withdrawal'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { QueueConsumerOutput } from '@abx-utils/async-message-consumer'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import {
  WithdrawalStatusChangeRequestType,
  WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL,
  BatchCryptoWithdrawalRequestWrapper,
} from '@abx-service-clients/withdrawal'

const logger = Logger.getInstance('withdrawal-processor', 'withdrawal-completion')

export async function completeWithdrawalRequest({ txid, currency }: WithdrawalCompletionPendingPayload): Promise<void | QueueConsumerOutput> {
  logger.debug(`Received withdrawal completion request for currency ${currency} and transaction ${txid}`)

  const allCurrencyCodes = await findAllCurrencyCodes(SymbolPairStateFilter.all)
  const currencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment, allCurrencyCodes)

  // We only need to verify the confirmation for natively implemented
  // coin integrations since the the ones implemented with Crypto API
  // are guaranteed to have been confirmed
  if (nativelyImplementedCoins.includes(currency)) {
    const onChainCurrencyGateway = currencyManager.getCurrencyFromTicker(currency)
    const transactionConfirmed = await onChainCurrencyGateway.checkConfirmationOfTransaction(txid)

    // The message will be returned to the queue for a later attempt
    if (!transactionConfirmed) {
      logger.info(`Withdrawal transaction with hash ${txid} not yet confirmed, putting back on queue for a later attempt`)
      return { skipMessageDeletion: true }
    }
  }

  await completeRequest(txid)
  await triggerWithdrawalForWaitingRequests(currency)
}

async function completeRequest(transactionId: string) {
  await wrapInTransaction(sequelize, null, async (transaction) => {
    const withdrawalRequestToComplete = await findWithdrawalRequestByTxHashWithFeeRequest(transactionId, transaction)

    if (!withdrawalRequestToComplete) {
      logger.warn(`Attempted to complete withdrawal request with txid ${transactionId} that could not be found`)
      return
    } else if (withdrawalRequestToComplete.state !== WithdrawalState.holdingsTransactionCompleted) {
      logger.warn(`Attempted to complete withdrawal request with txid ${transactionId} where the holdings transaction has not yet been recorded.`)
      return { skipMessageDeletion: true }
    }

    return completeCryptoWithdrawal(withdrawalRequestToComplete, transaction, withdrawalRequestToComplete.feeRequest)
  })
}

/**
 * In the case of BTC we might have a queue of withdrawal requests waiting on UTXOs to be confirmed,
 * when the current withdrawal transaction is confirmed, so they can be spent on the new withdrawals.
 * Therefore, upon a BTC withdrawal confirmation we need to trigger those queued requests (if any).
 *
 * @param currency the withdrawn currency
 */
async function triggerWithdrawalForWaitingRequests(withdrawnCurrency: CurrencyCode) {
  if (withdrawnCurrency === CurrencyCode.bitcoin) {
    const currency = await findCurrencyForCode(withdrawnCurrency)

    const waitingWithdrawalRequests = await findWithdrawalRequests({ currencyId: currency.id!, state: WithdrawalState.waiting })

    if (waitingWithdrawalRequests.length > 0) {
      const waitingWithdrawalIds = waitingWithdrawalRequests.map(({ id }) => id!)

      await sendAsyncChangeMessage<BatchCryptoWithdrawalRequestWrapper>({
        id: `pushNewCryptoWithdrawalRequestForProcessing-${waitingWithdrawalIds.join('-')}`,
        type: WithdrawalStatusChangeRequestType.createCryptoWithdrawal,
        target: {
          local: WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL!,
          deployedEnvironment: WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL!,
        },
        payload: { isBatch: true, currency: CurrencyCode.bitcoin },
      })
    }
  }
}
