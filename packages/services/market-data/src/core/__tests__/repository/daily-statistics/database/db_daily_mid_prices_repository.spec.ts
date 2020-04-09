import moment from 'moment'

import { expect } from 'chai'
import { findAllMidPricesForSymbols, findLatestMidPriceForSymbol, findOldestMidPriceForSymbol } from '../../../../repository'
import { initialiseRedis } from '../test-helper'
import { truncateTables, getModel } from '@abx-utils/db-connection-utils'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import sinon from 'sinon'
import { DepthMidPrice } from '@abx-types/market-data'

describe('db_daily_mid_prices_repository', async () => {
  let testAccount
  let testAccountTwo
  const kauUsd = 'KAU_USD'

  beforeEach(async () => {
    await truncateTables()
    sinon.restore()
    testAccount = await createTemporaryTestingAccount()
    testAccountTwo = await createTemporaryTestingAccount()
  })

  after(async () => {
    await truncateTables()
  })

  afterEach(() => sinon.restore())

  describe('findAllMidPricesForSymbols', async () => {
    it('should get mid prices in db. Last one is the latest mid price', async () => {
      await initialiseRedis({ testAccount, testAccountTwo, symbolId: kauUsd, addToDepth: true })

      const [midPriceOne, midPriceTwo] = (await findAllMidPricesForSymbols([kauUsd], moment().subtract(24, 'hours').toDate())).get(kauUsd)!

      expect(midPriceOne.price).to.eql(21)
      expect(midPriceTwo.price).to.eql(22)
    })
  })

  describe('findLatestMidPriceForSymbol', () => {
    it('should get the latest mid price in db', async () => {
      await initialiseRedis({ testAccount, testAccountTwo, symbolId: kauUsd, addToDepth: true })

      const midPrices = await findLatestMidPriceForSymbol(kauUsd)

      expect(midPrices).to.eql(21)
    })
  })

  describe('findOldestMidPriceForSymbol', () => {
    it('should get the oldest mid price in db', async () => {
      const oldestMidPriceForTheDay = 27

      const midPrices = [
        {
          id: 1,
          symbolId: kauUsd,
          price: 20,
          createdAt: moment().subtract('19', 'hours').toDate(),
          updatedAt: moment().subtract('19', 'hours').toDate(),
        },
        {
          id: 2,
          symbolId: kauUsd,
          price: oldestMidPriceForTheDay,
          createdAt: moment().subtract('20', 'hours').toDate(),
          updatedAt: moment().subtract('20', 'hours').toDate(),
        },
        {
          id: 3,
          symbolId: kauUsd,
          price: 30,
          createdAt: moment().subtract('30', 'hours').toDate(),
          updatedAt: moment().subtract('30', 'hours').toDate(),
        },
      ]

      await getModel<DepthMidPrice>('depth_mid_price').bulkCreate(midPrices)
      const midPrice = await findOldestMidPriceForSymbol(kauUsd, moment().subtract('24', 'hours').toDate())

      expect(midPrice).to.eql(oldestMidPriceForTheDay)
    })
  })
})
