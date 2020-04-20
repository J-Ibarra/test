/**
 * Creates a unique hash based on the sourceEventIds of the balance change payload objects.
 * Used to create an identifier when using triggerMultipleBalanceChanges.
 */
export function createUniqueHash(ids: number[]) {
  const concantenatedSourceIds = ids.reduce((acc, id) => acc.concat(`${id}`), '')

  let hash = 0

  if (concantenatedSourceIds.length == 0) return hash

  for (let i = 0; i < concantenatedSourceIds.length; i++) {
    const char = concantenatedSourceIds.charCodeAt(i)

    hash = (hash << 5) - hash + char

    hash = hash & hash // Convert to 32bit integer
  }

  return hash
}
