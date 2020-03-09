import { QueuePoller } from './queue_poller'
import { Environment } from '@abx-types/reference-data'
import { LocalRedisQueuePoller } from './local_redis_queue_poller'
import { AwsQueueObserver } from './aws_queue_poller'

const environmentsWithLocalRedisQueue = [Environment.development, Environment.e2eLocal, Environment.test]

export function getQueuePoller(): QueuePoller {
  return environmentsWithLocalRedisQueue.includes(process.env.NODE_ENV as Environment) ? new LocalRedisQueuePoller() : new AwsQueueObserver()
}

export * from './queue_poller'
