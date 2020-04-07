import moment from 'moment'

import { expect } from 'chai'
import { MemoryCache, truncateTables } from '@abx-utils/db-connection-utils'
import { OrderMatchStatus } from '@abx-types/order'
import { findAndStoreOrderMatchPrices, storeOrderMatchPrice, SYMBOL_TOTAL_TRADE_VOLUME } from '../../../../repository/daily-statistics'
import { initialiseRedis } from '../test-helper'
import { createTemporaryTestingAccount } from '@abx-utils/account'

describe('Caching the volume amounts', async () => {
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

  describe('findAndStoreOrderMatchPrices', async () => {
    it('should set all the order matches in cache', async () => {
      await initialiseRedis({ testAccount, testAccountTwo, symbolId: kauUsd, addToDepth: true })

      await findAndStoreOrderMatchPrices([kauUsd], moment().subtract(24, 'hours').toDate())

      const volume = MemoryCache.getInstance().get<number>(SYMBOL_TOTAL_TRADE_VOLUME(kauUsd))
      expect(volume).to.eql(15)
    })
  })

  describe('storeOrderMatchPrice', () => {
    it('should set order match in cache', () => {
      const orderMatch = {
        buyAccountId: testAccountTwo.id,
        sellAccountId: testAccount.id,
        symbolId: kauUsd,
        amount: 15,
        matchPrice: 20,
        status: OrderMatchStatus.settled,
      } as any
      storeOrderMatchPrice(orderMatch, moment().subtract(24, 'hours').toDate())

      const volume = MemoryCache.getInstance().get<number>(SYMBOL_TOTAL_TRADE_VOLUME(kauUsd))
      expect(volume).to.eql(15)
    })
  })
})
