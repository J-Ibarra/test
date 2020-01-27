import { expect } from 'chai'
import moment from 'moment'
import { truncateTables, MemoryCache } from '@abx/db-connection-utils'
import { findAndStoreMidPrices, storeMidPrice } from '../../../../repository'
import { initialiseRedis } from '../test-helper'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'

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
      await findAndStoreMidPrices(
        [kauUsd],
        moment()
          .subtract(24, 'hours')
          .toDate(),
      )
      const midPrices = MemoryCache.getInstance().getList<number>(`exchange:stats:change:${kauUsd}`)

      expect(midPrices).to.eql([21, 22])
    })
  })

  describe('storeMidPrice', () => {
    it('should set mid price in cache', () => {
      storeMidPrice(
        {
          id: 1,
          symbolId: kauUsd,
          price: 4,
          createdAt: moment()
            .subtract('2', 'hours')
            .toDate(),
        },
        moment()
          .subtract('24', 'hours')
          .toDate(),
      )
      const midPrices = MemoryCache.getInstance().getList<number>(`exchange:stats:change:${kauUsd}`)
      expect(midPrices).to.eql([4])
    })
    it('should set mid price in cache and it should be at the head of the list when returned', async () => {
      await initialiseRedis({ testAccount, testAccountTwo, symbolId: kauUsd, addToDepth: false })
      await findAndStoreMidPrices(
        [kauUsd],
        moment()
          .subtract(24, 'hours')
          .toDate(),
      )
      const midPrices = MemoryCache.getInstance().getList<number>(`exchange:stats:change:${kauUsd}`)

      expect(midPrices).to.eql([21, 22])

      storeMidPrice(
        {
          id: 5,
          symbolId: kauUsd,
          price: 4,
          createdAt: moment()
            .subtract('1', 'hours')
            .toDate(),
        },
        moment()
          .subtract('24', 'hours')
          .toDate(),
      )
      const midPricesTwo = MemoryCache.getInstance().getList<number>(`exchange:stats:change:${kauUsd}`)

      expect(midPricesTwo).to.eql([4, 21, 22])
    })
  })
})
