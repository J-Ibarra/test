import { expect } from 'chai'
import { MemoryCache, truncateTables } from '@abx/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import {
  getDailyMarketDataStats,
  getDailyMarketDataStatsForAllSymbols,
  getDailyMarketDataStatsForCurrency,
} from '../../../../repository/daily-statistics'
import { setupMemoryCache } from '../test-helper'
import sinon from 'sinon'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

describe('Retrieve the latest daily stats', async () => {
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

  afterEach(() => sinon.restore())

  describe('getDailyMarketDataStats', () => {
    it('should get stats, and should be able to get them a second time without out of order stats. Caused by lruCache (peek/get)', async () => {
      setupDailyStats(kauUsd)
      const dailyStatsForKauUsd = await getDailyMarketDataStats([kauUsd])

      expect(dailyStatsForKauUsd.length).to.eql(1)
      expect(dailyStatsForKauUsd[0].symbolId).to.eql(kauUsd)
      expect(dailyStatsForKauUsd[0].dailyChange).to.eql(-0.058823529411764705)
      expect(dailyStatsForKauUsd[0].dailyVolume).to.eql(18848)
      expect(dailyStatsForKauUsd[0].bidPrice).to.eql(3)
      expect(dailyStatsForKauUsd[0].askPrice).to.eql(4)

      const dailyStatsForKauUsdSecondTime = await getDailyMarketDataStats([kauUsd])
      expect(dailyStatsForKauUsdSecondTime.length).to.eql(1)
      expect(dailyStatsForKauUsdSecondTime[0].symbolId).to.eql(kauUsd)
      expect(dailyStatsForKauUsdSecondTime[0].dailyChange).to.eql(-0.058823529411764705)
      expect(dailyStatsForKauUsdSecondTime[0].dailyVolume).to.eql(18848)
      expect(dailyStatsForKauUsdSecondTime[0].bidPrice).to.eql(3)
      expect(dailyStatsForKauUsdSecondTime[0].askPrice).to.eql(4)
    })
    it('no data recorded for symbol - should return 0s', async () => {
      const dailyStatsForKauUsd = await getDailyMarketDataStats([kauUsd])
      expect(dailyStatsForKauUsd.length).to.eql(1)
      expect(dailyStatsForKauUsd[0].symbolId).to.eql(kauUsd)
      expect(dailyStatsForKauUsd[0].dailyChange).to.eql(0)
      expect(dailyStatsForKauUsd[0].dailyVolume).to.eql(0)
      expect(dailyStatsForKauUsd[0].bidPrice).to.eql(0)
      expect(dailyStatsForKauUsd[0].askPrice).to.eql(0)
    })
  })

  describe('getDailyMarketDataStatsForAllSymbols', () => {
    it('should return 18 symbols and only have  kau usd updated with values', async () => {
      setupDailyStats(kauUsd)

      sinon.stub(referenceDataOperations, 'getAllCompleteSymbolDetails').resolves([{ id: kauUsd }])
      const dailyStats = await getDailyMarketDataStatsForAllSymbols()
      expect(dailyStats.length).to.eql(1)

      const dailyStatsForKauUsd = dailyStats.find(({ symbolId }) => symbolId === kauUsd)!

      expect(dailyStatsForKauUsd.symbolId).to.eql(kauUsd)
      expect(dailyStatsForKauUsd.dailyChange).to.eql(-0.058823529411764705)
      expect(dailyStatsForKauUsd.dailyVolume).to.eql(18848)
      expect(dailyStatsForKauUsd.bidPrice).to.eql(3)
      expect(dailyStatsForKauUsd.askPrice).to.eql(4)
    })
  })

  describe('getDailyMarketDataStatsForCurrency', () => {
    it('get the ask price for a symbol', async () => {
      setupDailyStats(kauUsd)
      sinon.stub(referenceDataOperations, 'getAllSymbolsIncludingCurrency').resolves([{ id: kauUsd }])

      MemoryCache.getInstance().set({ key: `exchange:stats:ask:${kauUsd}`, val: 4 })
      MemoryCache.getInstance().set({ key: `exchange:stats:bid:${kauUsd}`, val: 3 })
      MemoryCache.getInstance().set({ key: `exchange:stats:ask:${kvtUsd}`, val: 20 })
      MemoryCache.getInstance().set({ key: `exchange:stats:bid:${kvtUsd}`, val: 15 })

      const dailyStats = await getDailyMarketDataStatsForCurrency(CurrencyCode.usd)
      expect(dailyStats.length).to.eql(1)
      const dailyStatsForKauUsd = dailyStats.find(({ symbolId }) => symbolId === kauUsd)!

      expect(dailyStatsForKauUsd.symbolId).to.eql(kauUsd)
      expect(dailyStatsForKauUsd.dailyChange).to.eql(-0.058823529411764705)
      expect(dailyStatsForKauUsd.dailyVolume).to.eql(18848)
      expect(dailyStatsForKauUsd.bidPrice).to.eql(3)
      expect(dailyStatsForKauUsd.askPrice).to.eql(4)
    })
  })
})
const setupDailyStats = symbol => {
  setupMemoryCache(symbol)
  MemoryCache.getInstance().set({ key: `exchange:stats:ask:${symbol}`, val: 4 })
  MemoryCache.getInstance().set({ key: `exchange:stats:bid:${symbol}`, val: 3 })
  MemoryCache.getInstance().set({ key: `exchange:stats:volume:${symbol}:1`, val: 4 })
  MemoryCache.getInstance().set({ key: `exchange:stats:volume:${symbol}:2`, val: 41 })
  MemoryCache.getInstance().set({ key: `exchange:stats:volume:${symbol}:3`, val: 41 })
  MemoryCache.getInstance().set({ key: `exchange:stats:volume:${symbol}:4`, val: 412 })
  MemoryCache.getInstance().set({ key: `exchange:stats:volume:${symbol}:5`, val: 44 })
  MemoryCache.getInstance().set({ key: `exchange:stats:volume:${symbol}:6`, val: 44 })
  MemoryCache.getInstance().set({ key: `exchange:stats:volume:${symbol}:7`, val: 2 })
  MemoryCache.getInstance().set({ key: `exchange:stats:volume:${symbol}:8`, val: 1 })
}
