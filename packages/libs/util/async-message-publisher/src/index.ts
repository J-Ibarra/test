import * as AWS from 'aws-sdk'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { Logger } from '@abx-utils/logging'
import { Environment, getAwsRegionForEnvironment } from '@abx-types/reference-data'

export interface AsyncMessage<T> {
  /** A descriptor of the message. */
  type: string
  /**
   * The message target, contains both the local redis pub-sub target
   * and the AWS SQS queue name for when the logic is executing in AWS.
   */
  target: {
    local: string
    deployedEnvironment: string
  }
  payload: T
}

const logger = Logger.getInstance('balance-internal-client', 'async_endpoints_handler')

export const environmentsWithLocalRedisQueue = [Environment.development, Environment.e2eLocal, Environment.test]
const sqs = new AWS.SQS({ region: getAwsRegionForEnvironment(process.env.NODE_ENV as Environment) })

/**
 * Publishes a message to a target medium. Based on the environment that it is executed in
 * the target would be an SQS queue (for all AWS environments) or a redis pub/sub topic (for local dev).
 *
 * @param target the name of the SQS queue/redis pub-sub topic
 * @param message contains the payload to publish
 */
export function sendAsyncChangeMessage<T>(message: AsyncMessage<T>): Promise<void> {
  return environmentsWithLocalRedisQueue.includes(process.env.NODE_ENV as Environment)
    ? publishChangeThroughRedis<T>(message)
    : queueChangeInSQS<T>(message)
}

function queueChangeInSQS<T>({ target, payload, type }: AsyncMessage<T>): Promise<void> {
  return new Promise((resolve, reject) => {
    sqs.sendMessage(
      {
        QueueUrl: target.deployedEnvironment,
        MessageBody: JSON.stringify(payload),
      },
      err => {
        if (!!err) {
          logger.error(`Error encountered while trying to place ${type} message on queue ${target.deployedEnvironment}: ${JSON.stringify(err)}`)
          reject(err)
        }

        resolve()
      },
    )
  })
}

function publishChangeThroughRedis<T>({ target, payload }: AsyncMessage<T>): Promise<void> {
  const epicurus = getEpicurusInstance()
  epicurus.publish(target.local, payload)

  return Promise.resolve()
}
