import { WithdrawalCompletionPendingPayload } from './model'
import { getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { findAllCurrencyCodes } from '@abx-service-clients/reference-data'
import { Environment, SymbolPairStateFilter } from '@abx-types/reference-data'
import { findWithdrawalRequestByTxHashWithFeeRequest } from '../../../../core'
import { completeCryptoWithdrawal } from './crypto'
import { Logger } from '@abx-utils/logging'
import { nativelyImplementedCoins } from '../common'
import { WithdrawalState } from '@abx-types/withdrawal'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { QueueConsumerOutput } from '@abx-utils/async-message-consumer'

const logger = Logger.getInstance('order-data', 'withdrawal-completion')

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

  await wrapInTransaction(sequelize, null, async (transaction) => {
    const withdrawalRequestToComplete = await findWithdrawalRequestByTxHashWithFeeRequest(txid, transaction)

    if (!withdrawalRequestToComplete) {
      logger.warn(`Attempted to complete withdrawal request with txid ${txid} that could not be found`)
      return
    } else if (withdrawalRequestToComplete.state !== WithdrawalState.holdingsTransactionCompleted) {
      logger.warn(`Attempted to complete withdrawal request with txid ${txid} where the holdings transaction has not yet been recorded.`)
      return { skipMessageDeletion: true }
    }

    return completeCryptoWithdrawal(withdrawalRequestToComplete, transaction, withdrawalRequestToComplete.feeRequest)
  })
}
