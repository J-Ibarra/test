import { Logger } from '@abx-utils/logging'
import { QueuePoller, QueueMessageHandler, QueueConsumerOutput } from './queue_poller'
import * as AWS from 'aws-sdk'
import { getAwsRegionForEnvironment, Environment } from '@abx-types/reference-data'

const sqs = new AWS.SQS({ region: getAwsRegionForEnvironment(process.env.NODE_ENV! as Environment) })

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
          this.invokeMessageHandler(data.Messages[0], queueUrl, handler)
        }

        return this.subscribeToQueueMessages(queueUrl, handler)
      },
    )
  }

  private async invokeMessageHandler<T>(message: AWS.SQS.Message, queueUrl: string, handler: QueueMessageHandler<T>) {
    try {
      const result = await handler(JSON.parse(message.Body!))

      if (!result || !(result as QueueConsumerOutput).skipMessageDeletion) {
        await this.removeMessageFromQueue(queueUrl, message.ReceiptHandle!)
      }
    } catch (e) {
      this.logger.error(`Error ocurred while invoking handler for message ${message.MessageId} on queue ${queueUrl}`)
      throw e
    }
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
