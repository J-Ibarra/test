import { expect } from 'chai'
import { MemoryCache } from '@abx/db-connection-utils'
import { truncateTables } from '@abx/db-connection-utils'
import { findAndStoreAskAndBidPrices, storeAskPrice, storeBidPrice } from '../../../../repository'
import { initialiseRedis } from '../test-helper'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import sinon from 'sinon'
// import * as referenceDataOperations from '@abx-service-clients/reference-data'

describe('Caching the ask and bid prices', async () => {
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
    // sinon.stub(referenceDataOperations, 'getAllCompleteSymbolDetails').resolves([{ id: kauUsd }])
  })

  after(async () => {
    await truncateTables()
  })

  afterEach(() => sinon.restore())

  describe('findAndStoreAskAndBidPrices', async () => {
    it('should set all the order matches in cache', async () => {
      await initialiseRedis({ testAccount, testAccountTwo, symbolId: kauUsd, addToDepth: true })
      // sinon.stub(orderOperations, 'getOpenOrders').resolves([])

      await findAndStoreAskAndBidPrices([kauUsd])

      const askPrice = MemoryCache.getInstance().get<number>(`exchange:stats:ask:${kauUsd}`)
      const bidPrice = MemoryCache.getInstance().get<number>(`exchange:stats:bid:${kauUsd}`)
      expect(askPrice).to.eql(25)
      expect(bidPrice).to.eql(20)
    })
  })

  describe('setBidPrice', () => {
    it('should set bid price in cache', () => {
      storeBidPrice(2, kauUsd)

      const bidPrice = MemoryCache.getInstance().get<number>(`exchange:stats:bid:${kauUsd}`)
      expect(bidPrice).to.eql(2)
    })
  })
  describe('setAskPrice', async () => {
    it('should set ask price in cache', async () => {
      storeAskPrice(1, kauUsd)

      const askPrice = MemoryCache.getInstance().get<number>(`exchange:stats:ask:${kauUsd}`)
      expect(askPrice).to.eql(1)
    })
  })
})
