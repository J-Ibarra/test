import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { WithdrawalCompletionPendingPayload } from './model'
import { IAddressTransactionEventPayload, getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { completeWithdrawalRequest } from './withdrawal_request_completer'
import { findWithdrawalRequest } from '../../../../core'
import { holdingsAddressTransactionNotificationEnabledCurrencies } from '../common'
import { Logger } from '@abx-utils/logging'

const requiredConfirmationsForCurrency = {
  [CurrencyCode.bitcoin]: parseInt(process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS || '1'),
}
const logger = Logger.getInstance('withdrawal-processor', 'withdrawal_completion_message_validation_proxy')

/**
 * The withdrawal completion flow can be trigger in 2 different ways:
 * 1. An address transaction notification for all coins where CryptoApis kinesis holdings address transaction webhooks are used
 * 2. Directly triggered by the second step of the withdrawal flow, after the withdrawal transaction has been recorded
 *
 * @param message the message to payload
 */
export function processWithdrawalCompletionRequest(message: WithdrawalCompletionPendingPayload | IAddressTransactionEventPayload) {
  if (holdingsAddressTransactionNotificationEnabledCurrencies.includes(message.currency)) {
    return completeWithdrawalRequestIfOutgoingTransactionConfirmed(message as IAddressTransactionEventPayload)
  }

  return completeWithdrawalRequest(message as WithdrawalCompletionPendingPayload)
}

/**
 * When an address transaction notification is received (from a CryptoAPIs webhook) we need to verify the following before triggering the completion flow
 * - the transaction is outgoing (from the holdings address), as notifications are received for both incoming and outgoing txs
 * - the transaction confirmations are enough (based on business requirements)
 * - a withdrawal request exists with the transaction hash - in the case of test environments we might have the same test holdings wallet
 *  set up and we only want to react to the notification in the environment where the withdrawal has been created
 *
 * @param notificationPayload the address transaction CryptoApis notification
 */
async function completeWithdrawalRequestIfOutgoingTransactionConfirmed({ currency, address, txid, confirmations }: IAddressTransactionEventPayload) {
  const onChainCurrencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment, [currency])

  const [transactionDetails, withdrawalRequest] = await Promise.all([
    onChainCurrencyManager.getCurrencyFromTicker(currency).getTransaction(txid, address),
    findWithdrawalRequest({ txHash: txid }),
  ])
  const isTransactionOutgoing = transactionDetails!.senderAddress === address

  if (isTransactionOutgoing && confirmations === requiredConfirmationsForCurrency[currency] && !!withdrawalRequest) {
    return completeWithdrawalRequest({ txid, currency } as WithdrawalCompletionPendingPayload)
  } else {
    logUnhandledNotificationReason({ isTransactionOutgoing, address, currency, txid, confirmations, withdrawalRequest })
  }
}

function logUnhandledNotificationReason({ isTransactionOutgoing, address, currency, txid, confirmations, withdrawalRequest }) {
  if (!isTransactionOutgoing) {
    logger.debug(
      `Transaction notification received for address ${address} and ${currency}, with id ${txid}, is not outgoing. Withdrawal completion skipped.`,
    )
  } else if (confirmations !== requiredConfirmationsForCurrency[currency]) {
    logger.debug(
      `Transaction notification received for address ${address} and ${currency}, with id ${txid}, has ${confirmations} confirmations. Withdrawal completion skipped.`,
    )
  } else if (!withdrawalRequest) {
    logger.debug(
      `Outgoing transaction notification received for address ${address} and ${currency}, with id ${txid}, with ${confirmations} confirmations but withdrawal request not found.`,
    )
  }
}
