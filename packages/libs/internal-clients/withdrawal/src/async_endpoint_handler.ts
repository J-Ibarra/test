import { WithdrawalStatusChangeRequestType, FiatWithdrawalCreationRequest, AsyncWithdrawalStatusChangeRequest } from './async_change_model'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { WITHDRAWAL_STATUS_CHANGE_QUEUE_URL, localRedisWithdrawalChangeTopic } from './async_endpoint_handler.constants'

export function cancelFiatWithdrawal(adminRequestId: number) {
  return sendAsyncChangeMessage<AsyncWithdrawalStatusChangeRequest>({
    id: `${adminRequestId}`,
    type: WithdrawalStatusChangeRequestType.cancelFiatWithdrawal,
    target: {
      local: localRedisWithdrawalChangeTopic,
      deployedEnvironment: WITHDRAWAL_STATUS_CHANGE_QUEUE_URL!,
    },
    payload: {
      type: WithdrawalStatusChangeRequestType.cancelFiatWithdrawal,
      payload: {
        adminRequestId,
      },
    },
  })
}

export function createFiatWithdrawal(fiatWithdrawalCreationParams: FiatWithdrawalCreationRequest) {
  return sendAsyncChangeMessage<AsyncWithdrawalStatusChangeRequest>({
    id: fiatWithdrawalCreationParams.transactionId,
    type: WithdrawalStatusChangeRequestType.createFiatWithdrawal,
    target: {
      local: localRedisWithdrawalChangeTopic,
      deployedEnvironment: WITHDRAWAL_STATUS_CHANGE_QUEUE_URL!,
    },
    payload: {
      type: WithdrawalStatusChangeRequestType.createFiatWithdrawal,
      payload: fiatWithdrawalCreationParams,
    },
  })
}
