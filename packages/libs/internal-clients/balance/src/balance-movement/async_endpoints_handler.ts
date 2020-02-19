import {
  BalanceAsyncRequestType,
  BasicBalanceAsyncRequestPayload,
  InitialReserveBalanceChangeAsyncRequestPayload,
  BalanceChangeAsyncRequest,
  BalanceChangeAsyncRequestContainer,
} from '../queue-request'
import { Environment } from '@abx-types/reference-data'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'

export const environmentsWithLocalRedisQueue = [Environment.development, Environment.e2eLocal, Environment.test]
export const localRedisBalanceChangeTopic = 'local-balance-change-topic'

/**
 * Triggers multiple balance change operations on the balance service side
 * all executed within the same logical database transaction.
 *
 * @param changes the balance change operatios to be applied
 */
export function triggerMultipleBalanceChanges(changes: BalanceChangeAsyncRequest[]) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: 'triggerMultipleBalanceChanges',
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: changes,
    },
  })
}

export function releaseReserve(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: 'releaseReserve',
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.releaseReserve,
          payload,
        },
      ],
    },
  })
}

export function finaliseReserve(payload: InitialReserveBalanceChangeAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: 'finaliseReserve',
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.finaliseReserve,
          payload,
        },
      ],
    },
  })
}

export function confirmPendingRedemption(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: 'confirmPendingRedemption',
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.confirmPendingRedemption,
          payload,
        },
      ],
    },
  })
}

export function denyPendingRedemption(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: 'denyPendingRedemption',
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.denyPendingRedemption,
          payload,
        },
      ],
    },
  })
}

export function createPendingDeposit(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: 'createPendingDeposit',
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.createPendingDeposit,
          payload,
        },
      ],
    },
  })
}

export function confirmPendingDeposit(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: BalanceAsyncRequestType.createPendingDeposit,
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.createPendingDeposit,
          payload,
        },
      ],
    },
  })
}

export function denyPendingDeposit(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: BalanceAsyncRequestType.denyPendingDeposit,
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.denyPendingDeposit,
          payload,
        },
      ],
    },
  })
}

export function confirmPendingWithdrawal(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: BalanceAsyncRequestType.confirmPendingWithdrawal,
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.confirmPendingWithdrawal,
          payload,
        },
      ],
    },
  })
}

export function denyPendingWithdrawal(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: BalanceAsyncRequestType.denyPendingWithdrawal,
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.denyPendingWithdrawal,
          payload,
        },
      ],
    },
  })
}

export function confirmPendingDebitCardTopUp(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: BalanceAsyncRequestType.confirmPendingDebitCardTopUp,
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.confirmPendingDebitCardTopUp,
          payload,
        },
      ],
    },
  })
}

export function recordDebitCardToExchangeWithdrawal(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    type: BalanceAsyncRequestType.recordDebitCardToExchangeWithdrawal,
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.recordDebitCardToExchangeWithdrawal,
          payload,
        },
      ],
    },
  })
}
