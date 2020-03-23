import bluebird from 'bluebird'
import redis from 'redis'
import { Logger } from '@nestjs/common'

import { RedisConfig } from '../../models'

bluebird.promisifyAll(redis.RedisClient.prototype)

export const ASYNCHRONOUS_REDIS_CLIENT = 'asynchronous_redis_client'
const logger = new Logger('createAsynchronousRedisClient')

export const createAsynchronousRedisClient = ({ host, port }: RedisConfig) => {
  logger.debug(`Creating client to ${host} ${port}`)
  return redis.createClient({ host, port })
}
