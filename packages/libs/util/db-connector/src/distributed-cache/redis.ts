import { RedisConfig } from '../model'
import { getEnvironmentConfig } from '../env-config'
import { CacheGateway } from './cache-gateway'
import { APIRedisGateway } from './api-redis-gateway'
import { RedisGateway } from './redis-gateway'

const redisDbConfig = getEnvironmentConfig().redisDb
let redisClient
let cacheClient: CacheGateway | undefined
let cacheSubscriptionClient: CacheGateway | undefined
let apiCacheClient: APIRedisGateway | undefined

export function getApiCacheClient(): APIRedisGateway {
  if (!apiCacheClient) {
    const apiCacheConfig: RedisConfig = { ...redisDbConfig }
    apiCacheConfig.db = 1

    apiCacheClient = new APIRedisGateway(apiCacheConfig)
  }

  return apiCacheClient
}

export async function closeApiCacheClient(): Promise<void> {
  if (apiCacheClient) {
    await apiCacheClient.quit()
    apiCacheClient = undefined
  }
}

// Singleton function.
export function getCacheClient(): CacheGateway {
  if (!cacheClient) {
    cacheClient = new RedisGateway(redisDbConfig)
  }

  return cacheClient
}

export async function closeCacheClient(): Promise<void> {
  if (cacheClient) {
    await cacheClient.quit()
    cacheClient = undefined
  }
}

// Another connection for subscribers
export function getCacheSubClient(): CacheGateway {
  if (!cacheSubscriptionClient) {
    cacheSubscriptionClient = new RedisGateway(redisDbConfig)
  }

  return cacheSubscriptionClient
}

export async function closeSubClient(): Promise<void> {
  if (cacheSubscriptionClient) {
    await cacheSubscriptionClient.quit()
    cacheSubscriptionClient = undefined
  }
}

/**
 * This is only intended to be used by third-party tools
 * which require a vanilla redis client. (e.g warlock)
 */
export function getVanillaRedisClient() {
  if (!redisClient) {
    redisClient = (getCacheClient() as RedisGateway).redisClient
  }

  return redisClient
}

export async function closeVanillaRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = undefined
  }
}
