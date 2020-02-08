import { expect } from 'chai'
import { truncateTables } from '@abx-utils/db-connection-utils'
import { findAskAndBidPricesForSymbols } from '../../../../repository/daily-statistics'
import { initialiseRedis } from '../test-helper'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import sinon from 'sinon'

describe('db_ask_and_bid_repository', async () => {
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

  describe('findAskAndBidPricesForSymbols', async () => {
    it('should get ask and bid price from dbb', async () => {
      await initialiseRedis({ testAccount, testAccountTwo, symbolId: kauUsd, addToDepth: true })

      const [askAndBidPrices] = (await findAskAndBidPricesForSymbols([kauUsd])).get(kauUsd)!
      expect(askAndBidPrices.askPrice).to.eql(25)
      expect(askAndBidPrices.bidPrice).to.eql(20)
    })
  })
})
