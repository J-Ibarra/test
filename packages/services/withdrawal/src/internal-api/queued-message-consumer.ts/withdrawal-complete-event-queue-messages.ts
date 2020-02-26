import {
  EWebhookWithdrawalCompletedRequestType,
  IAsyncWebhookWithdrawalCompletedRequest,
} from '@abx-service-clients/withdrawal/src/async_change_model'
import { findWithdrawalRequestByTxHash, PENDING_COMPLETION_WITHDRAWAL_GATEKEEPER_NAME, CryptoWithdrawalGatekeeper } from '../../core'
import { Logger } from '@abx-utils/logging'
import { getCurrencyCode, findCurrencyForCode } from '@abx-service-clients/reference-data'
const logger = Logger.getInstance('withdrawal', 'queue_message_consumer_withdrawal_confirmed_event')

export async function consumeCompletedWithdrawalQueueMessage(request: IAsyncWebhookWithdrawalCompletedRequest) {
  switch (request.type) {
    case EWebhookWithdrawalCompletedRequestType.confirmedTransaction:
      await submitWithdrawalCompletedEvent(request)
  }

  return Promise.resolve()
}

async function submitWithdrawalCompletedEvent(request: IAsyncWebhookWithdrawalCompletedRequest) {
  logger.debug(`Processing request for completed transaction: ${JSON.stringify(request)}`)

  const withdrawalRequest = await findWithdrawalRequestByTxHash(request.payload.txid)

  if (!withdrawalRequest) {
    logger.warn(`Withdrawal request not found: request of: ${JSON.stringify(request)}`)
  }

  const withdrawalGatekeeper = CryptoWithdrawalGatekeeper.getSingletonInstance(PENDING_COMPLETION_WITHDRAWAL_GATEKEEPER_NAME)
  const currencyCode = await getCurrencyCode(withdrawalRequest?.currencyId!)

  if (!currencyCode) {
    logger.warn(`Currency code is not valid, withdrawal request id: ${withdrawalRequest?.id}`)
  }
  const currency = await findCurrencyForCode(currencyCode)

  withdrawalGatekeeper.addNewWithdrawalRequestForCurrency(currencyCode, { withdrawalRequest: { ...withdrawalRequest!, currency } })
}
