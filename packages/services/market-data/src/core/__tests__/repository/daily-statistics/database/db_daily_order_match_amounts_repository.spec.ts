import moment from 'moment'

import { expect } from 'chai'
import { MemoryCache, truncateTables } from '@abx/db-connection-utils'
import { initialiseRedis } from '../test-helper'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import { findOrderMatchTransactionsForSymbols } from '../../../../repository'

describe('db_daily_order_match_amounts_repository', async () => {
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

  describe('findOrderMatchTransactionsForSymbols', async () => {
    it('should get order match transaction from db', async () => {
      await initialiseRedis({ testAccount, testAccountTwo, symbolId: kauUsd, addToDepth: true })

      const [orderMatchTransactionsKauUsd] = (
        await findOrderMatchTransactionsForSymbols(
          [kauUsd],
          moment()
            .subtract(24, 'hours')
            .toDate(),
        )
      ).get(kauUsd)!

      expect(orderMatchTransactionsKauUsd.amount).to.eql(15)
    })
  })
})
