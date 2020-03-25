import bluebird from 'bluebird'
import moment from 'moment'
import redis from 'redis'
import { e2eTestingEnvironments, Environment } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { RedisGateway } from './redis-gateway'

bluebird.promisifyAll(redis.RedisClient.prototype)

interface IAPICacheEntry<T> {
  value: T
  expiresAt: number
}

const logger = Logger.getInstance('api', 'response-cache')

/** Provides a Redis-based {@link CacheGateway} implementation which encapsulates all redis interactions. */
export class APIRedisGateway extends RedisGateway {
  private keyPrefix: string = 'api-cache-'

  /**
   * Stores an API cache entry in the database
   *
   * @param key The key to associate with the cached item
   * @param value The value to be cached
   * @param ttl The time-to-live for the cached item in SECONDS
   */
  public setCache<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {
    if (e2eTestingEnvironments.includes(process.env.NODE_ENV as Environment)) {
      return Promise.resolve(true)
    }

    const cacheKey: string = this.getKey(key)

    const storedValue: IAPICacheEntry<T> = {
      value,
      expiresAt: moment()
        .add('seconds', ttl)
        .toDate()
        .getTime(),
    }

    logger.info(`Setting cache entry ${cacheKey}`)

    return this.set<IAPICacheEntry<T>>(cacheKey, storedValue)
  }

  /**
   * Retrieves the requested cached item from Redis if available
   *
   * @param key The key for the cached item
   */
  public async getCache<T>(key: string): Promise<T | null> {
    const cacheKey: string = this.getKey(key)
    logger.info(`Getting cache entry ${cacheKey}`)

    const response: IAPICacheEntry<T> = await this.get<IAPICacheEntry<T>>(cacheKey)
    const currentTime = new Date().getTime()

    if (!response || currentTime >= response.expiresAt) {
      logger.info(`Cache entry for ${cacheKey} either does not exist or is expired`)
      return null
    }

    logger.info(`Successfully fetched cache entry ${cacheKey}`)

    return response.value
  }

  private getKey(key: string) {
    return `${this.keyPrefix}${key}`
  }
}
