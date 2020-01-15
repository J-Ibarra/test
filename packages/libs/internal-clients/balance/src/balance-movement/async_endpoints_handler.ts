import * as AWS from 'aws-sdk'
import {
  BalanceAsyncRequestType,
  BalanceChangeAsyncRequestContainer,
  BasicBalanceAsyncRequestPayload,
  InitialReserveBalanceChangeAsyncRequestPayload,
} from '@abx-types/balance'
import { Logger } from '@abx/logging'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { Environment } from '@abx-types/reference-data'

const sqs = new AWS.SQS()

const logger = Logger.getInstance('balance-internal-client', 'async_endpoints_handler')
export const environmentsWithLocalRedisQueue = [Environment.development, Environment.e2eLocal, Environment.test]
export const localRedisBalanceChangeTopic = 'local-balance-change-topic'

export function releaseReserve(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.releaseReserve,
        payload,
      },
    ],
  })
}

export function finaliseReserve(payload: InitialReserveBalanceChangeAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.finaliseReserve,
        payload,
      },
    ],
  })
}

export function confirmPendingRedemption(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.confirmPendingRedemption,
        payload,
      },
    ],
  })
}

export function denyPendingRedemption(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.denyPendingRedemption,
        payload,
      },
    ],
  })
}

export function createPendingDeposit(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.createPendingDeposit,
        payload,
      },
    ],
  })
}

export function confirmPendingDeposit(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.confirmPendingDeposit,
        payload,
      },
    ],
  })
}

export function denyPendingDeposit(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.denyPendingDeposit,
        payload,
      },
    ],
  })
}

export function confirmPendingWithdrawal(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.confirmPendingWithdrawal,
        payload,
      },
    ],
  })
}

export function denyPendingWithdrawal(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.denyPendingWithdrawal,
        payload,
      },
    ],
  })
}

export function confirmPendingDebitCardTopUp(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.confirmPendingDebitCardTopUp,
        payload,
      },
    ],
  })
}

export function recordDebitCardToExchangeWithdrawal(payload: BasicBalanceAsyncRequestPayload) {
  return sendAsyncChangeMessage({
    requestedChanges: [
      {
        type: BalanceAsyncRequestType.recordDebitCardToExchangeWithdrawal,
        payload,
      },
    ],
  })
}

function sendAsyncChangeMessage(changes: BalanceChangeAsyncRequestContainer): Promise<void> {
  return environmentsWithLocalRedisQueue.includes(process.env.NODE_ENV as Environment)
    ? publishChangeThroughRedis(changes)
    : queueChangeInSQS(changes)
}

function queueChangeInSQS(changes: BalanceChangeAsyncRequestContainer): Promise<void> {
  return new Promise((resolve, reject) => {
    sqs.sendMessage(
      {
        QueueUrl: process.env.BALANCE_QUEUE_URL!,
        MessageBody: JSON.stringify(changes),
      },
      err => {
        if (!!err) {
          logger.error(`Error encountered while trying to place ${changes.requestedChanges[0].type} message on queue: ${JSON.stringify(err)}`)
          reject(err)
        }

        resolve()
      },
    )
  })
}

function publishChangeThroughRedis(changes: BalanceChangeAsyncRequestContainer): Promise<void> {
  const epicurus = getEpicurusInstance()
  epicurus.publish(localRedisBalanceChangeTopic, changes)

  return Promise.resolve()
}
