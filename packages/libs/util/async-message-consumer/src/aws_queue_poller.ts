import { Logger } from '@abx-utils/logging'
import { QueuePoller, QueueMessageHandler } from './queue_poller'
import * as AWS from 'aws-sdk'

const sqs = new AWS.SQS()

/** Uses AWS SQS as queuing mechanism, subscribing to new messages. */
export class AwsQueueObserver implements QueuePoller {
  private logger = Logger.getInstance('aws-queue-poller', 'AwsQueueObserver')

  subscribeToQueueMessages<T>(queueUrl: string, handler: QueueMessageHandler<T>) {
    sqs.receiveMessage(
      {
        QueueUrl: queueUrl.trim(),
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      },
      async (err, data) => {
        if (err!!) {
          this.logger.error(`${JSON.stringify(err)}`)
        } else if (!!data && !!data.Messages) {
          const message = data.Messages[0]
          await handler(JSON.parse(message.Body!))
          await this.removeMessageFromQueue(queueUrl, message.ReceiptHandle!)
        }

        return this.subscribeToQueueMessages(queueUrl, handler)
      },
    )
  }

  private removeMessageFromQueue(queueUrl: string, messageReceiptHandle: string) {
    return new Promise((resolve, reject) => {
      sqs.deleteMessage(
        {
          QueueUrl: queueUrl,
          ReceiptHandle: messageReceiptHandle,
        },
        err => {
          if (err!!) {
            this.logger.error(`Unable to remove message from queue with receipt handle ${messageReceiptHandle}`)
            reject()
          }

          resolve()
        },
      )
    })
  }
}
