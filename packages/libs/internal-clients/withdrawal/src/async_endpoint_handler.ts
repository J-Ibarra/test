import * as AWS from 'aws-sdk'
import { Environment } from '@abx-types/reference-data'

const sqs = new AWS.SQS()
export const environmentsWithLocalRedisQueue = [Environment.development, Environment.e2eLocal, Environment.test]
export const localRedisWithdrawalChangeTopic = 'local-withdrawal-change-topic'

export function cancelFiatWithdrawal(adminRequestId: number) {}

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
