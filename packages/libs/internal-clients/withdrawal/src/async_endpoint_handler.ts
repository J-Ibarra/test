import * as AWS from 'aws-sdk'
import { Environment } from '@abx-types/reference-data'
import { AsyncWithdrawalStatusChangeRequest, WithdrawalStatusChangeRequestType, FiatWithdrawalCreationRequest } from './async_change_model'
import { Logger } from '@abx/logging'

const sqs = new AWS.SQS()
const logger = Logger.getInstance('balance-internal-client', 'async_endpoints_handler')
export const environmentsWithLocalRedisQueue = [Environment.development, Environment.e2eLocal, Environment.test]
export const localRedisWithdrawalChangeTopic = 'local-withdrawal-change-topic'

export function cancelFiatWithdrawal(adminRequestId: number) {
  return queueChangeInSQS({
    type: WithdrawalStatusChangeRequestType.cancelFiatWithdrawal,
    payload: {
      adminRequestId,
    },
  })
}

export function createFiatWithdrawal(fiatWithdrawalCreationParams: FiatWithdrawalCreationRequest) {
  return queueChangeInSQS({
    type: WithdrawalStatusChangeRequestType.cancelFiatWithdrawal,
    payload: fiatWithdrawalCreationParams,
  })
}

export function completeFiatWithdrawal(adminRequestId: number, fee: number) {
  return queueChangeInSQS({
    type: WithdrawalStatusChangeRequestType.completeFiatWithdrawal,
    payload: {
      adminRequestId,
      fee,
    },
  })
}

function queueChangeInSQS(changes: AsyncWithdrawalStatusChangeRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    sqs.sendMessage(
      {
        QueueUrl: process.env.WITHDRAWAL_STATUS_CHANGE_QUEUE_URL!,
        MessageBody: JSON.stringify(changes),
      },
      err => {
        if (!!err) {
          logger.error(`Error encountered while trying to place ${changes.type} message on queue: ${JSON.stringify(err)}`)
          reject(err)
        }

        resolve()
      },
    )
  })
}
