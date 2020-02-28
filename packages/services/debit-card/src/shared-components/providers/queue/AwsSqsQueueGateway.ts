import * as AWS from 'aws-sdk'
import { Logger } from '@nestjs/common'
import { QueueGateway } from './QueueGateway'

const sqs = new AWS.SQS()

export class AwsSqsQueueGateway<T> implements QueueGateway<T> {
  private logger = new Logger('AwsSqsQueueGateway')

  subscribeToQueueMessages(queueUrl: string, handler: (message: T) => Promise<void>) {
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
          await handler(JSON.parse(message.Body!) as T)
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
