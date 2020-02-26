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
    id: `triggerMultipleBalanceChanges-${createUniqueHash(changes.map(({ payload }) => payload))}`,
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
    id: `releaseReserve-${payload.sourceEventId}`,
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
    id: `finaliseReserve-${payload.sourceEventId}`,
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
    id: `confirmPendingRedemption-${payload.sourceEventId}`,
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
    id: `denyPendingRedemption-${payload.sourceEventId}`,
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
    id: `createPendingDeposit-${payload.sourceEventId}`,
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
    id: `confirmPendingDeposit-${payload.sourceEventId}`,
    type: BalanceAsyncRequestType.confirmPendingDeposit,
    target: {
      local: localRedisBalanceChangeTopic,
      deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
    },
    payload: {
      requestedChanges: [
        {
          type: BalanceAsyncRequestType.confirmPendingDeposit,
          payload,
        },
      ],
    },
  })
}

export function denyPendingDeposit(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
    id: `${BalanceAsyncRequestType.denyPendingDeposit}-${payload.sourceEventId}`,
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
    id: `${BalanceAsyncRequestType.confirmPendingWithdrawal}-${payload.sourceEventId}`,
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
    id: `${BalanceAsyncRequestType.denyPendingWithdrawal}-${payload.sourceEventId}`,
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
    id: `${BalanceAsyncRequestType.confirmPendingDebitCardTopUp}-${payload.sourceEventId}`,
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
    id: `${BalanceAsyncRequestType.recordDebitCardToExchangeWithdrawal}-${payload.sourceEventId}`,
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

/**
 * Creates a unique hash based on the sourceEventIds of the balance change payload objects.
 * Used to create an identifier when using triggerMultipleBalanceChanges.
 */
function createUniqueHash(payloads: BasicBalanceAsyncRequestPayload[]) {
  const concantenatedSourceIds = payloads.reduce((acc, { sourceEventId }) => acc.concat(`${sourceEventId}`), '')

  let hash = 0

  if (this.length == 0) return hash

  for (let i = 0; i < concantenatedSourceIds.length; i++) {
    const char = concantenatedSourceIds.charCodeAt(i)

    hash = (hash << 5) - hash + char

    hash = hash & hash // Convert to 32bit integer
  }

  return hash
}
