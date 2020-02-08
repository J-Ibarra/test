import { expect } from 'chai'
import moment from 'moment'
import { getModel, truncateTables, MemoryCache } from '@abx-utils/db-connection-utils'
import { getDailyChange, getLatestMidPrice, getOldestMidPrice } from '../../../../repository/daily-statistics'
import { setupMemoryCache } from '../test-helper'
import { DepthMidPrice } from '@abx-types/market-data'

describe('Retrieve the mid prices', async () => {
  let memCacheGateway: MemoryCache
  const kauUsd = 'KAU_USD'

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

  describe('getLatestMidPrice', () => {
    it('get the latest mid price', async () => {
      setupMemoryCache(kauUsd)
      const midPriceKAUUSD = getLatestMidPrice(kauUsd)
      expect(midPriceKAUUSD).to.eql(32)
    })
  })

  describe('getOldestMidPrice', () => {
    it('get the oldest mid price', async () => {
      setupMemoryCache(kauUsd)
      const midPriceKAUUSD = getOldestMidPrice(kauUsd)
      expect(midPriceKAUUSD).to.eql(34)
    })
  })

  describe('getDailyChange', () => {
    it('get the daily change value', async () => {
      setupMemoryCache(kauUsd)

      const midPriceKAUUSD = await getDailyChange([kauUsd])
      expect(midPriceKAUUSD.size).to.eql(1)
      expect(midPriceKAUUSD.get(kauUsd)).to.eql(-0.058823529411764705)
    })

    it('mid prices are empty - should return 0 value', async () => {
      const midPriceKAUUSD = await getDailyChange([kauUsd])
      expect(midPriceKAUUSD.size).to.eql(1)
      expect(midPriceKAUUSD.get(kauUsd)).to.eql(0)
    })

    it('mid prices are empty - should retrieve mid price from database', async () => {
      await getModel<DepthMidPrice>('depth_mid_price').create({
        id: 1,
        symbolId: kauUsd,
        price: 27,
        createdAt: moment()
          .subtract('26', 'hours')
          .toDate(),
      })
      await getModel<DepthMidPrice>('depth_mid_price').create({
        id: 2,
        symbolId: kauUsd,
        price: 20,
        createdAt: moment()
          .subtract('25', 'hours')
          .toDate(),
      })

      const midPriceKAUUSD = await getDailyChange([kauUsd])
      expect(midPriceKAUUSD.size).to.eql(1)
      expect(midPriceKAUUSD.get(kauUsd)).to.eql(20)
    })

    it('latest === oldest mid price - should return latest', async () => {
      MemoryCache.getInstance().set({ key: `exchange:stats:change:${kauUsd}:1`, val: 34 })
      MemoryCache.getInstance().set({ key: `exchange:stats:change:${kauUsd}:2`, val: 47 })
      MemoryCache.getInstance().set({ key: `exchange:stats:change:${kauUsd}:3`, val: 48 })
      MemoryCache.getInstance().set({ key: `exchange:stats:change:${kauUsd}:4`, val: 34 })
      const midPriceKAUUSD = await getDailyChange([kauUsd])
      expect(midPriceKAUUSD.size).to.eql(1)
      expect(midPriceKAUUSD.get(kauUsd)).to.eql(34)
    })
  })
})
