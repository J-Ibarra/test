import LruCache from 'lru-cache'
import { Logger } from '@abx-utils/logging'

export interface CachingObject<T> {
  key: string
  val: T
  ttl?: number
}

export class MemoryCache {
  private static instance: MemoryCache
  private logger = Logger.getInstance('cache', 'memory-gateway')
  private cache: LruCache<string, any>

  constructor() {
    this.cache = new LruCache()
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new MemoryCache()
    }

    return this.instance
  }

  public static newInstance() {
    this.instance = new MemoryCache()

    return this.instance
  }

  /**
   * Returns an array of <T> that was cached
   * @param key an array of keys that we want to acquire
   */
  public get<T>(key: string): T | undefined {
    this.logger.debug(`getting key: ${key}`)
    return this.cache.peek(key)
  }

  /**
   * Returns true if it was successfully set
   * @param arrayToCache an array of objects we wish to cache. The value is of type T
   */
  public set<T>({ key, ttl = 60_000, val }: CachingObject<T>): boolean {
    this.logger.debug(`setting key: ${key}, ttl: ${ttl}, value: ${val}`)
    return this.cache.set(key, val, ttl)
  }

  /**
   * Returns an array of <T> that was cached
   * latest value is at the head of the list
   * @param key an array of keys that we want to acquire
   */
  public getList<T>(filteringKey: string): T[] {
    const keys = this.getKeysStartingWith(filteringKey)
    return keys.map((key) => this.get<T>(key)!).filter((k) => k)
  }

  /**
   * Returns true if it was successfully set
   * Ensure that if you are passing an array with values that have different ttl's and
   * you expect them to go in the correct order into the cache. That you put the
   * oldest values (values you wish to expire first) at the head of the array
   * @param arrayToCache an array of objects we wish to cache. The value is of type T
   */
  public setList<T>(values: Array<CachingObject<T>>): boolean {
    values.map((value) => this.set(value))
    return true
  }

  /**
   * Returns a set of keys that match the key filter
   * @param startingKeyFilter A string that partially matches against keys you want to get
   */
  private getKeysStartingWith(startingKeyFilter: string = ''): string[] {
    if (!startingKeyFilter) {
      return []
    }
    return this.cache.keys().filter((key) => key.indexOf(startingKeyFilter) === 0)
  }

  public async flush(): Promise<void> {
    this.cache.reset()
  }
}

export default MemoryCache
