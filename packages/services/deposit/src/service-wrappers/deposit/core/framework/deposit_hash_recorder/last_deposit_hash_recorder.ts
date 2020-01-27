import { getCacheClient } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'

const cacheGateway = getCacheClient()
export const currencyToTransactionHashRedisKey = 'exchange:last-seen-transaction-hashes'

const currencyToLastCheckedTransactionHash: Map<CurrencyCode, string> = new Map()

export function getLastSeenTransactionHash(currency: CurrencyCode) {
  return currencyToLastCheckedTransactionHash.get(currency)
}

/** Invoked by the deposit transactions fetcher when a new transaction hash for a given account and currency has been found. */
export function saveTransactionHash(currency: CurrencyCode, transactionHash: string): Promise<void> {
  currencyToLastCheckedTransactionHash.set(currency, transactionHash)

  return cacheGateway.setHashValue(currencyToTransactionHashRedisKey, currency, transactionHash)
}

/** Invoked on service startup. */
export async function loadLastSeenTransactionHashes() {
  const currencyToTransactionHash = (await cacheGateway.getAllHashValues(currencyToTransactionHashRedisKey)) || {}

  Object.keys(currencyToTransactionHash).forEach(currency =>
    currencyToLastCheckedTransactionHash.set(currency as CurrencyCode, currencyToTransactionHash[currency]),
  )
}
