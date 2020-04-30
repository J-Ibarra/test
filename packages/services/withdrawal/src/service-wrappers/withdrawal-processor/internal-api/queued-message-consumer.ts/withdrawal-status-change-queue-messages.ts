import { Logger } from '@abx-utils/logging'
import {
  WithdrawalStatusChangeRequestType,
  AsyncWithdrawalStatusChangeRequest,
  FiatWithdrawalCancellationChangeRequest,
} from '@abx-service-clients/withdrawal'
import { findWithdrawalRequest, cancelWithdrawalRequest, initialiseFiatWithdrawalRequest } from '../../../../core'
import { WithdrawalState } from '@abx-types/withdrawal'

const logger = Logger.getInstance('withdrawal', 'queue_message_consumer_withdrawal_status_change')

export async function consumeFiatWithdrawalQueueMessages(request: AsyncWithdrawalStatusChangeRequest) {
  try {
    switch (request.type) {
      case WithdrawalStatusChangeRequestType.cancelFiatWithdrawal:
        await cancelFiatWithdrawal(request)
      case WithdrawalStatusChangeRequestType.createFiatWithdrawal:
        await createFiatWithdrawal(request)
    }
    return Promise.resolve()
  } catch (e) {
    logger.error(`An error has ocurred while processing a withdrawal status change request: ${JSON.stringify(request)}`)

    return { skipMessageDeletion: true }
  }
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
  await initialiseFiatWithdrawalRequest({ ...(request.payload as any), state: WithdrawalState.pending })
}
