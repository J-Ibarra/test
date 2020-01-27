import moment from 'moment'

import { expect } from 'chai'
import { findAllMidPricesForSymbols, findLatestMidPriceForSymbol } from '../../../../repository'
import { initialiseRedis } from '../test-helper'
import { truncateTables } from '@abx/db-connection-utils'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import sinon from 'sinon'

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

      const [midPriceOne, midPriceTwo] = (
        await findAllMidPricesForSymbols(
          [kauUsd],
          moment()
            .subtract(24, 'hours')
            .toDate(),
        )
      ).get(kauUsd)!

      expect(midPriceOne.price).to.eql(22)
      expect(midPriceTwo.price).to.eql(21)
    })
  })

  describe('findLatestMidPriceForSymbol', () => {
    it('should get the latest mid price in db', async () => {
      await initialiseRedis({ testAccount, testAccountTwo, symbolId: kauUsd, addToDepth: true })

      const midPrices = await findLatestMidPriceForSymbol(kauUsd)

      expect(midPrices).to.eql(21)
    })
  })
})
