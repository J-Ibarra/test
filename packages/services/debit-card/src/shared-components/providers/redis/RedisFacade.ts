import { Injectable, Inject, Logger } from '@nestjs/common'
import Warlock from 'node-redis-warlock'

import { SYNCHRONOUS_REDIS_CLIENT } from './SynchronousRedisClient'
import { ASYNCHRONOUS_REDIS_CLIENT } from './AsynchonousRedisClient'

@Injectable()
export class RedisFacade {
  private warlock
  private logger = new Logger('RedisFacade')
  private readonly defaultLockTimeToLive = 10_000 // Default Lifetime of the lock, 10 seconds

  constructor(
    @Inject(ASYNCHRONOUS_REDIS_CLIENT) private redisClient,
    @Inject(SYNCHRONOUS_REDIS_CLIENT) synchronousRedisClient,
  ) {
    this.warlock = Warlock(synchronousRedisClient)
  }

  /**
   * Attempts to obtain a lock for a given key in order to prevent concurrent mutation.
   *
   * @param key the key to lock
   * @param maxAttempts the maximum times to try before failing, in case lock already taken
   * @param wait the time to wait between failed attempts
   */
  public lock(
    key: string,
    maxAttempts = 5,
    wait = 1500,
  ): Promise<VoidFunction> {
    return new Promise((resolve, reject) => {
      this.warlock.optimistic(
        key,
        this.defaultLockTimeToLive,
        maxAttempts,
        wait,
        (err, unlock) => {
          if (!!err) {
            this.logger.warn(`Unable to obtain lock for ${key}`)
            return reject({ message: `Unable to obtain lock for ${key}` })
          }

          this.logger.debug(`Successfully obtained lock for ${key}`)
          resolve(unlock)
        },
      )
    })
  }

  /**
   * Sets the value for a given hash field stored at a given redis key.
   *
   * @param {T} Type of the value.
   * @param key the redis key
   * @param field the hash field
   * @param value the value to push
   */
  public addValueToHash<T>(
    key: string,
    field: string,
    value: T,
  ): Promise<void> {
    return this.redisClient.hsetAsync(key, field, JSON.stringify(value))
  }

  /**
   * Sets the values for a set of hash fields stored at a given redis key.
   *
   * @param {T} Type of the value.
   * @param key the key
   * @param hashFieldToValue the field to value to push
   */
  public addValuesToHash<T>(
    key: string,
    hashFieldToValue: Map<string, T>,
  ): Promise<void> {
    const fieldAndValues = Array.from(hashFieldToValue).reduce(
      (acc, [field, value]) => {
        return acc.concat([field, JSON.stringify(value)])
      },
      [] as string[],
    )

    return this.redisClient.hmsetAsync(key, fieldAndValues)
  }

  /**
   * Removes specific fields from a hash stored a given key.
   *
   * @param {T} Type of the value.
   * @param key the key
   * @param hashFields the hash fields to remove
   */
  public removeValuesFromHash(
    key: string,
    hashFields: string[],
  ): Promise<boolean> {
    return this.redisClient.hdelAsync(key, hashFields)
  }

  /**
   * Gets all the field values for a hash stored in a given key.
   *
   * @param {T} Type of the list entries.
   * @returns {Promise<T[]>} Promise object resolves with the list field values stored at the hash
   */
  public async getHashValues<T>(key: string): Promise<T[]> {
    const redisHashValues: Record<
      string,
      string
    > = await this.redisClient.hgetallAsync(key)

    if (!redisHashValues || Object.keys(redisHashValues).length === 0) {
      return []
    }

    return Object.values(redisHashValues).map(hashValue =>
      JSON.parse(hashValue),
    )
  }

  /** Deletes the data for all keys. */
  public flush(): Promise<void> {
    return this.redisClient.flushallAsync()
  }
}
