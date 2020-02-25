import { Environment } from '@abx-types/reference-data'
import { WithdrawalStatusChangeRequestType, FiatWithdrawalCreationRequest, AsyncWithdrawalStatusChangeRequest } from './async_change_model'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'

export const environmentsWithLocalRedisQueue = [Environment.development, Environment.e2eLocal, Environment.test]
export const localRedisWithdrawalChangeTopic = 'local-withdrawal-change-topic'

export function cancelFiatWithdrawal(adminRequestId: number) {
  return sendAsyncChangeMessage<AsyncWithdrawalStatusChangeRequest>({
    id: `${adminRequestId}`,
    type: WithdrawalStatusChangeRequestType.cancelFiatWithdrawal,
    target: {
      local: localRedisWithdrawalChangeTopic,
      deployedEnvironment: process.env.WITHDRAWAL_STATUS_CHANGE_QUEUE_URL!,
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
      deployedEnvironment: process.env.WITHDRAWAL_STATUS_CHANGE_QUEUE_URL!,
    },
    payload: {
      type: WithdrawalStatusChangeRequestType.createFiatWithdrawal,
      payload: fiatWithdrawalCreationParams,
    },
  })
}
