import { expect } from 'chai'
import { MemoryCache, truncateTables } from '@abx-utils/db-connection-utils'
import {
  getAskPriceForAllSymbols,
  getAskPriceForSymbol,
  getBidPriceForAllSymbols,
  getBidPriceForSymbol,
} from '../../../../repository/daily-statistics/retrieval/retrieve_ask_and_bid_repository'

describe('Retrieve the ask and bid prices', async () => {
  let memCacheGateway: MemoryCache
  const kauUsd = 'KAU_USD'
  const kvtUsd = 'KVT_USD'

  before(async () => {
    await truncateTables()
    memCacheGateway = MemoryCache.newInstance()
  })
  beforeEach(async () => {
    await truncateTables()
    await memCacheGateway.flush()
  })

  after(async () => {
    await truncateTables()
  })

  describe('getBidPriceForSymbol', () => {
    it('get the bid price for a symbol', async () => {
      MemoryCache.getInstance().set({ key: `exchange:stats:ask:${kauUsd}`, val: 4 })
      MemoryCache.getInstance().set({ key: `exchange:stats:bid:${kauUsd}`, val: 3 })
      MemoryCache.getInstance().set({ key: `exchange:stats:ask:${kvtUsd}`, val: 20 })
      MemoryCache.getInstance().set({ key: `exchange:stats:bid:${kvtUsd}`, val: 15 })

      const bidPriceKAUUSD = getBidPriceForSymbol(kauUsd)
      const bidPriceKVTUSD = getBidPriceForSymbol(kvtUsd)
      expect(bidPriceKAUUSD).to.eql(3)
      expect(bidPriceKVTUSD).to.eql(15)
    })
  })

  describe('getBidPriceForAllSymbols', () => {
    it('get the bid price for all symbols', async () => {
      MemoryCache.getInstance().set({ key: `exchange:stats:ask:${kauUsd}`, val: 4 })
      MemoryCache.getInstance().set({ key: `exchange:stats:bid:${kauUsd}`, val: 3 })
      MemoryCache.getInstance().set({ key: `exchange:stats:ask:${kvtUsd}`, val: 20 })
      MemoryCache.getInstance().set({ key: `exchange:stats:bid:${kvtUsd}`, val: 15 })

      const bidPrices = getBidPriceForAllSymbols([kauUsd, kvtUsd])

      expect(bidPrices.get(kauUsd)).to.eql(3)
      expect(bidPrices.get(kvtUsd)).to.eql(15)
    })
  })

  describe('getAskPriceForSymbol', () => {
    it('get the ask price for a symbol', async () => {
      MemoryCache.getInstance().set({ key: `exchange:stats:ask:${kauUsd}`, val: 4 })
      MemoryCache.getInstance().set({ key: `exchange:stats:bid:${kauUsd}`, val: 3 })
      MemoryCache.getInstance().set({ key: `exchange:stats:ask:${kvtUsd}`, val: 20 })
      MemoryCache.getInstance().set({ key: `exchange:stats:bid:${kvtUsd}`, val: 15 })

      const askPriceKAUUSD = getAskPriceForSymbol(kauUsd)
      const askPriceKVTUSD = getAskPriceForSymbol(kvtUsd)
      expect(askPriceKAUUSD).to.eql(4)
      expect(askPriceKVTUSD).to.eql(20)
    })
  })

  describe('getAskPriceForAllSymbols', () => {
    it('get the ask price for all symbols', async () => {
      MemoryCache.getInstance().set({ key: `exchange:stats:ask:${kauUsd}`, val: 4 })
      MemoryCache.getInstance().set({ key: `exchange:stats:bid:${kauUsd}`, val: 3 })
      MemoryCache.getInstance().set({ key: `exchange:stats:ask:${kvtUsd}`, val: 20 })
      MemoryCache.getInstance().set({ key: `exchange:stats:bid:${kvtUsd}`, val: 15 })
      const bidPrices = getAskPriceForAllSymbols([kauUsd, kvtUsd])

      expect(bidPrices.get(kauUsd)).to.eql(4)
      expect(bidPrices.get(kvtUsd)).to.eql(20)
    })
  })
})
