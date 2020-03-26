import bluebird from 'bluebird'
import { isEmpty } from 'lodash'
import redis from 'redis'
import { RedisConfig } from '../model'
import { CacheGateway } from './cache-gateway'

bluebird.promisifyAll(redis.RedisClient.prototype)

/** Provides a Redis-based {@link CacheGateway} implementation which encapsulates all redis interactions. */
export class RedisGateway implements CacheGateway {
  public redisClient

  constructor({ host, port, db }: RedisConfig) {
    this.redisClient = redis.createClient({ host, port, db })
  }

  public async quit(): Promise<void> {
    this.redisClient.quit()
  }

  public set<T>(key: string, value: T): Promise<boolean> {
    return this.redisClient.setAsync(key, JSON.stringify(value)).then(result => result === 'OK')
  }

  public get<T>(key: string): Promise<T> {
    return this.redisClient.getAsync(key).then(JSON.parse)
  }

  public getAll<T>(keys: string[]): Promise<T[]> {
    return this.redisClient.mgetAsync(...keys).then(values => values.map(value => JSON.parse(value)))
  }

  public getList<T>(key: string, limit = 0, offset = 0): Promise<T[]> {
    return this.redisClient.lrangeAsync(key, offset, limit - 1).then(entries => {
      if (isEmpty(entries)) {
        return []
      }

      return !!entries.length ? entries.map(JSON.parse) : JSON.parse(entries)
    })
  }

  public trimList(key: string, start: number, end): Promise<void> {
    return this.redisClient.ltrimAsync(key, start, end)
  }

  public addValueToHeadOfList<T>(key: string, value: T): Promise<number> {
    return this.redisClient.lpushAsync(key, JSON.stringify(value))
  }

  public addValuesToHeadOfList<T>(key: string, values: T[]): Promise<number> {
    const stringifiedValues = values.map(value => JSON.stringify(value)).reverse()

    return this.redisClient.lpushAsync(key, ...stringifiedValues)
  }

  public addValueToTailOfList<T>(key: string, ...values: T[]): Promise<number> {
    const stringifiedValues = values.map(value => JSON.stringify(value))

    return this.redisClient.rpushAsync(key, stringifiedValues)
  }

  public getListLength(key: string): Promise<number> {
    return this.redisClient.llenAsync(key)
  }

  public popLastElement<T>(key: string): Promise<T> {
    return this.redisClient.rpopAsync(key).then(JSON.parse)
  }

  public incrementHashField(key: string, field: string, increment: number): Promise<number> {
    return this.redisClient.hincrbyAsync(key, field, increment)
  }

  public async getAllHashValues(key: string): Promise<Record<string, string>> {
    return await this.redisClient.hgetallAsync(key)
  }

  public async setHashValue(key: string, field: string, value: string | number): Promise<void> {
    await this.redisClient.hsetAsync(key, field, `${value}`)
  }

  public flush(): Promise<void> {
    return this.redisClient.flushallAsync()
  }

  public publish<T>(channel: string, message: T): Promise<number> {
    return this.redisClient.publishAsync(channel, JSON.stringify(message))
  }

  public delete(key: string) {
    return this.redisClient.delAsync(key)
  }
}
