import { expect } from 'chai'
import { MemoryCache, truncateTables } from '@abx-utils/db-connection-utils'
import { getDailyVolume, MID_PRICE_LATEST_KEY, SYMBOL_TOTAL_TRADE_VOLUME } from '../../../../repository/daily-statistics'

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
      MemoryCache.getInstance().set({ key: MID_PRICE_LATEST_KEY(kauUsd), val: 10 })
      MemoryCache.getInstance().set({ key: SYMBOL_TOTAL_TRADE_VOLUME(kauUsd), val: 1 })

      const dailyVolume = await getDailyVolume([kauUsd])
      expect(dailyVolume.size).to.eql(1)
      expect(dailyVolume.get(kauUsd)).to.eql(10)
    })

    it('no stored match prices - should get nothing', async () => {
      const dailyVolume = await getDailyVolume([kauUsd])
      expect(dailyVolume.size).to.eql(1)
      expect(dailyVolume.get(kauUsd)).to.eql(0)
    })
  })
})
