import {
  AsyncWithdrawalStatusChangeRequest,
  WithdrawalStatusChangeRequestType,
  FiatWithdrawalCancellationChangeRequest,
} from '@abx-service-clients/withdrawal/dist/async_change_model'
import { cancelWithdrawalRequest, findWithdrawalRequest, initialiseFiatWithdrawalRequest } from '../core'
import { Logger } from '@abx-utils/logging'
import { WithdrawalState } from '@abx-types/withdrawal'

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

    await initialiseFiatWithdrawalRequest({ ...(request.payload as any), state: WithdrawalState.pending })
  }

  return Promise.resolve()
}
