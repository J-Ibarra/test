/**
 * Defines a key-value in-memory cache facade.
 * Allows for multiple cache implementations if required.
 */
export interface CacheGateway {
  /**
   * Safely closes active connections
   * 
   * @returns {Promise<void>}
   */
  quit(): Promise<void>

  /**
   * Sets the value for a specific key.
   *
   * @param {T} Type of the value.
   * @param key the key
   * @param value the value
   * @returns {Promise<boolean>} Promise object represents the success of the operation
   */
  set<T>(key: string, value: T): Promise<boolean>

  /**
   * Gets the value for a specific key, used when objects or primitives are stored in the key.
   *
   * @param {T} Type of the value.
   * @param key the key
   * @returns {Promise<T>} Promise object resolves with the value stored at the key
   */
  get<T>(key: string): Promise<T>

  /**
   * Gets the list value for a specific key.
   *
   * @param {T} Type of the list entries.
   * @param key the key
   * @param limit the max number of list entries to retrieve
   * @param offset the position at which you start taking values. offset can be negative which means it starts from the end/tail
   * @returns {Promise<T[]>} Promise object resolves with the list value stored at the key
   */
  getList<T>(key: string, limit?: number, offset?: number): Promise<T[]>

  /**
   * Trims the list stored at a specific key to only contain the elements in the range defined.
   *
   * @param key the key
   * @param start the start index, inclusive, 0-based
   * @param end the end index, inclusive
   * @returns {Promise} Promise object resolves when list update is completed
   */
  trimList(key: string, start: number, end: number): Promise<void>

  /**
   * Returns the values of all specified keys.
   *
   * @param {T} Type of the values.
   * @param keys the keys
   * @returns {Promise<T[]>} Promise object resolves with the values for all keys
   */
  getAll<T>(keys: string[]): Promise<T[]>

  /**
   * Prepends a value to a list stored at {@code key} if such list exists.
   * List before - ['foo']
   * Operation - addValueToHeadOfList<string>('list', 'a')
   * List after - ['a', 'foo']
   *
   * @param {T} Type of the value.
   * @param key the key
   * @param value the value to push
   * @returns {Promise<number>} Promise object resolves with number of items after insert
   */
  addValueToHeadOfList<T>(key: string, value: T): Promise<number>

  /**
   * Prepends a value to a list stored at {@code key} if such list exists.
   * The order of values will remains the same when inserted:
   * List before - ['foo']
   * Operation - addValueToHeadOfList<string>('list', 'a', 'b')
   * List after - ['a', 'b', 'foo']
   *
   * @param {T} Type of the value.
   * @param key the key
   * @param values the values to push
   * @returns {Promise<number>} Promise object resolves with number of items after insert
   */
  addValuesToHeadOfList<T>(key: string, values: T[]): Promise<number>

  /**
   * Appends a value to a list stored at {@code key} if such list exists.
   *
   * @param {T} Type of the value.
   * @param key the key
   * @param value the value to push
   * @returns {Promise<number>} Promise object resolves with number of items after insert
   */
  addValueToTailOfList<T>(key: string, ...value: T[]): Promise<number>

  /**
   * Returns the length of the list stored at {@code key}.
   *
   * @param key the key
   * @returns {Promise<number>} Promise object resolves with list length
   */
  getListLength(key: string): Promise<number>

  /**
   * Removes and returns the last element of the list stored at key.
   *
   * @param {T} Type of the value.
   * @param key the key
   * @returns {Promise} Promise object resolves with the last element of null if no element present
   */
  popLastElement<T>(key: string): Promise<T>

  /**
   * Sets the value for a given {@code field} in the hash stored at {@code key}.
   *
   * @param key the key
   * @param field the hash field name
   * @param value the value to set
   */
  setHashValue(key: string, field: string, value: string | number): Promise<void>

  /**
   * Increments the number stored at {@code field} in the hash stored at {@code key} by {@code increment}.
   *
   * @param key the key where the hash is stored
   * @param field the hash field to increment
   * @param increment the amount to increment by
   * @returns {Promise<number>} Promise object resolves with the value after increment
   */
  incrementHashField(key: string, field: string, increment: number): Promise<number>

  /**
   * Gets all values of a hash stored at {@code key}.
   *
   * @param key the key where the hash is stored
   * @returns {Promise<Record<string, string>>} Promise object resolves with a map where each hash field is key and its value is the value for that key respectively
   */
  getAllHashValues(key: string): Promise<Record<string, string>>

  /** Deletes the data for all keys. */
  flush(): Promise<void>

  /**
   * Publishes a message to a given channel
   *
   * @param channel the channel to publish the message to
   * @param message the message to publish
   * @returns {Promise<number>} Promise object resolves with the number of clients that received the message
   */
  publish<T>(channel: string, message: T): Promise<number>
}
