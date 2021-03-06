import {
  WithdrawalStatusChangeRequestType,
  FiatWithdrawalCreationRequest,
  AsyncWithdrawalStatusChangeRequest,
  SingleCryptoWithdrawalRequestWrapper,
} from './async_change_model'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import {
  WITHDRAWAL_STATUS_CHANGE_QUEUE_URL,
  localRedisWithdrawalChangeTopic,
  WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL,
} from './async_endpoint_handler.constants'

export function cancelFiatWithdrawal(adminRequestId: number) {
  return sendAsyncChangeMessage<AsyncWithdrawalStatusChangeRequest>({
    id: `cancelFiatWithdrawal-${adminRequestId}`,
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
    id: `createFiatWithdrawal-${fiatWithdrawalCreationParams.transactionId}`,
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

export function pushNewCryptoWithdrawalRequestForProcessing(withdrawalRequestId: number) {
  return sendAsyncChangeMessage<SingleCryptoWithdrawalRequestWrapper>({
    id: `pushNewCryptoWithdrawalRequestForProcessing-${withdrawalRequestId}`,
    type: WithdrawalStatusChangeRequestType.createCryptoWithdrawal,
    target: {
      local: WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL!,
      deployedEnvironment: WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL!,
    },
    payload: { isBatch: false, id: withdrawalRequestId },
  })
}
