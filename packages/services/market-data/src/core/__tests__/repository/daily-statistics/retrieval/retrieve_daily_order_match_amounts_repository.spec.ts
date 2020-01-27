import { expect } from 'chai'
import { MemoryCache, truncateTables } from '@abx/db-connection-utils'
import { getDailyVolume } from '../../../../repository/daily-statistics'

describe('Retrieve the order match amounts', async () => {
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

  describe('getDailyVolume', () => {
    it('get the daily volume for a symbol', async () => {
      MemoryCache.getInstance().set({ key: `exchange:stats:change:${kauUsd}:1`, val: 10 })

      MemoryCache.getInstance().set({ key: `exchange:stats:volume:${kauUsd}:1`, val: 4 })
      MemoryCache.getInstance().set({ key: `exchange:stats:volume:${kauUsd}:2`, val: 41 })
      MemoryCache.getInstance().set({ key: `exchange:stats:volume:${kauUsd}:3`, val: 41 })
      MemoryCache.getInstance().set({ key: `exchange:stats:volume:${kauUsd}:4`, val: 412 })
      MemoryCache.getInstance().set({ key: `exchange:stats:volume:${kauUsd}:5`, val: 44 })
      MemoryCache.getInstance().set({ key: `exchange:stats:volume:${kauUsd}:6`, val: 44 })
      MemoryCache.getInstance().set({ key: `exchange:stats:volume:${kauUsd}:7`, val: 2 })
      MemoryCache.getInstance().set({ key: `exchange:stats:volume:${kauUsd}:8`, val: 1 })

      const dailyVolume = getDailyVolume([kauUsd])
      expect(dailyVolume.size).to.eql(1)
      expect(dailyVolume.get(kauUsd)).to.eql(5890)
    })

    it('no stored match prices - should get nothing', async () => {
      const dailyVolume = getDailyVolume([kauUsd])
      expect(dailyVolume.size).to.eql(1)
      expect(dailyVolume.get(kauUsd)).to.eql(0)
    })
  })
})
