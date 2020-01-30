import {
  AsyncWithdrawalStatusChangeRequest,
  WithdrawalStatusChangeRequestType,
  FiatWithdrawalCancellationChangeRequest,
} from '@abx-service-clients/withdrawal/dist/async_change_model'
import { cancelWithdrawalRequest, findWithdrawalRequest, createWithdrawalRequest } from '../core'
import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('withdrawal', 'queue_message_consumer')

export async function consumeQueueMessage(request: AsyncWithdrawalStatusChangeRequest) {
  if (request.type === WithdrawalStatusChangeRequestType.cancelFiatWithdrawal) {
    logger.debug(`Processing request for withdrawal request cancellation: ${JSON.stringify(request)}`)
    const withdrawalRequestToCancel = await findWithdrawalRequest({
      adminRequestId: (request.payload as FiatWithdrawalCancellationChangeRequest).adminRequestId,
    })
    await cancelWithdrawalRequest(withdrawalRequestToCancel!)
  } else if (request.type === WithdrawalStatusChangeRequestType.createFiatWithdrawal) {
    logger.debug(`Processing request for fiat withdrawal request creation: ${JSON.stringify(request)}`)
    await createWithdrawalRequest(request.payload as any)
  }

  return Promise.resolve()
}
