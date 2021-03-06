import { expect } from 'chai'
import moment from 'moment'
import { truncateTables, MemoryCache } from '@abx-utils/db-connection-utils'
import { findAndStoreMidPrices, storeMidPrice, getLatestMidPrice, getOldestMidPrice, getMidPriceLiveStream } from '../../../../repository'
import { initialiseRedis } from '../test-helper'
import { createTemporaryTestingAccount } from '@abx-utils/account'

describe('Caching the mid prices', async () => {
  let testAccount
  let testAccountTwo
  let memCacheGateway: MemoryCache
  const kauUsd = 'KAU_USD'

  before(async () => {
    await truncateTables()
    memCacheGateway = MemoryCache.newInstance()
  })
  beforeEach(async () => {
    await truncateTables()
    await memCacheGateway.flush()
    testAccount = await createTemporaryTestingAccount()
    testAccountTwo = await createTemporaryTestingAccount()
  })

  after(async () => {
    await truncateTables()
  })

  describe('findAndStoreMidPrices', async () => {
    it('should set all mid prices in cache', async () => {
      await initialiseRedis({ testAccount, testAccountTwo, symbolId: kauUsd, addToDepth: false })
      await findAndStoreMidPrices([kauUsd], moment().subtract(24, 'hours').toDate())

      const latestMidPrice = await getLatestMidPrice(kauUsd)
      const oldestMidPrice = await getOldestMidPrice(kauUsd)

      expect(latestMidPrice).to.eql(21)
      expect(oldestMidPrice).to.eql(22)
    })
  })

  describe('storeMidPrice', () => {
    it('should set mid price in cache', async () => {
      storeMidPrice(
        {
          symbolId: kauUsd,
          price: 4,
          createdAt: moment().subtract('2', 'hours').toDate(),
        },
        moment().subtract('24', 'hours').toDate(),
      )

      const midPrice = await getLatestMidPrice(kauUsd)
      expect(midPrice).to.eql(4)
    })
  })

  it('midPriceLiveStream should emit on mid price updates', () => {
    const midPriceLiveStream = getMidPriceLiveStream()

    let price = 0
    midPriceLiveStream.on(kauUsd, (priceEmitted) => (price = priceEmitted))

    const midPriceUpdate = 12

    storeMidPrice({ symbolId: kauUsd, price: midPriceUpdate, createdAt: new Date() }, new Date())

    expect(price).to.eql(midPriceUpdate)
  })
})
