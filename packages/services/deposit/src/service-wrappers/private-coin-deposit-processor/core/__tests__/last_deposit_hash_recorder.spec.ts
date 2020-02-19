import { expect } from 'chai'
import { getCacheClient } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import {
  currencyToTransactionHashRedisKey,
  getLastSeenTransactionHash,
  loadLastSeenTransactionHashes,
  saveTransactionHash,
} from '../framework/deposit_hash_recorder/last_deposit_hash_recorder'

describe('last_deposit_hash_recorder', () => {
  const transactionHash = 'tx-hash-1'
  const transactionHash2 = 'tx-hash-2'

  let cacheClient
  beforeEach(async () => {
    cacheClient = getCacheClient()
    cacheClient.flush()
  })

  it('should return last see hash for currencies', async () => {
    await saveTransactionHash(CurrencyCode.kau, transactionHash)

    expect(getLastSeenTransactionHash(CurrencyCode.kau)).to.eql(transactionHash)
  })

  it('loadLastSeenTransactionHashes should load all last seen transaction hashes from persistent cache', async () => {
    cacheClient.setHashValue(currencyToTransactionHashRedisKey, CurrencyCode.kau, transactionHash)
    cacheClient.setHashValue(currencyToTransactionHashRedisKey, CurrencyCode.kag, transactionHash2)

    await loadLastSeenTransactionHashes()

    expect(getLastSeenTransactionHash(CurrencyCode.kau)).to.eql(transactionHash)
    expect(getLastSeenTransactionHash(CurrencyCode.kag)).to.eql(transactionHash2)
  })
})
