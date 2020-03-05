import { Logger } from '@abx-utils/logging'
import {
  WithdrawalStatusChangeRequestType,
  AsyncWithdrawalStatusChangeRequest,
  FiatWithdrawalCancellationChangeRequest,
} from '@abx-service-clients/withdrawal'
import { findWithdrawalRequest, cancelWithdrawalRequest, createWithdrawalRequest } from '../../../../core'

const logger = Logger.getInstance('withdrawal', 'queue_message_consumer_withdrawal_status_change')

export async function consumeFiatWithdrawalQueueMessages(request: AsyncWithdrawalStatusChangeRequest) {
  switch (request.type) {
    case WithdrawalStatusChangeRequestType.cancelFiatWithdrawal:
      await cancelFiatWithdrawal(request)
    case WithdrawalStatusChangeRequestType.createFiatWithdrawal:
      await createFiatWithdrawal(request)
  }
  return Promise.resolve()
}

async function cancelFiatWithdrawal(request: AsyncWithdrawalStatusChangeRequest) {
  logger.debug(`Processing request for withdrawal request cancellation: ${JSON.stringify(request)}`)

  const withdrawalRequestToCancel = await findWithdrawalRequest({
    adminRequestId: (request.payload as FiatWithdrawalCancellationChangeRequest).adminRequestId,
  })
  await cancelWithdrawalRequest(withdrawalRequestToCancel!)
}

async function createFiatWithdrawal(request: AsyncWithdrawalStatusChangeRequest) {
  logger.debug(`Processing request for fiat withdrawal request creation: ${JSON.stringify(request)}`)
  await createWithdrawalRequest(request.payload as any)
}
