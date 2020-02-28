import redis from 'redis'

import { RedisConfig } from '../../models'
import { Logger } from '@nestjs/common'

export const SYNCHRONOUS_REDIS_CLIENT = 'synchronous_redis_client'
const logger = new Logger('createSynchronousRedisClient')

export const createSynchronousRedisClient = ({ host, port }: RedisConfig) => {
  logger.debug(`Creating client to ${host} ${port}`)
  return redis.createClient({ host, port })
}
