import * as AWS from 'aws-sdk'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { Logger } from '@abx-utils/logging'
import { Environment, getAwsRegionForEnvironment } from '@abx-types/reference-data'

export interface AsyncMessage<T> {
  /** A descriptor of the message. */
  type: string
  /** Used for FIFO SQS queues to define the MessageGroupId. */
  id?: string
  /**
   * The message target, contains both the local redis pub-sub target
   * and the AWS SQS queue name for when the logic is executing in AWS.
   */
  target: {
    /** The Redis topic to be used when running the app locally (in development mode). */
    local: string
    /** The SQS queue URL for when executing in AWS. */
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
  return environmentsWithLocalRedisQueue.includes(process.env.NODE_ENV as Environment) &&
    (!message.target.deployedEnvironment || message.target.deployedEnvironment.startsWith('local'))
    ? publishChangeThroughRedis<T>(message)
    : queueChangeInSQS<T>(message)
}

/**
 * Sends a message to an SQS queue.
 * If and id is passed in the parameter object, it will be considered that the message needs to be
 * sent to a FIFO queue so the id will be used to set the mandatory MessageGroupId and MessageDeduplicationId
 *
 * @param param the message contents
 */
function queueChangeInSQS<T>({ target, payload, type, id }: AsyncMessage<T>): Promise<void> {
  logger.debug(`Queuing message with id ${id} on ${target.deployedEnvironment || target.local}`)

  return new Promise((resolve, reject) => {
    sqs.sendMessage(
      !!id
        ? {
            MessageGroupId: id,
            MessageDeduplicationId: id,
            QueueUrl: target.deployedEnvironment,
            MessageBody: JSON.stringify(payload),
          }
        : {
            QueueUrl: target.deployedEnvironment,
            MessageBody: JSON.stringify(payload),
          },
      (err, data) => {
        if (!!err) {
          logger.error(`Error encountered while trying to place ${type} message on queue ${target.deployedEnvironment}: ${JSON.stringify(err)}`)
          reject(err)
        }

        logger.debug(`Successfully placed message with id ${id}, ${JSON.stringify(data)}`)
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
