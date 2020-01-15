import { expect } from 'chai'
import { getCacheClient, truncateTables } from '@abx/db-connection-utils'
import { createDumbOrder, createDumbOrderMatchTransaction } from '../utils'
import { OrderDirection } from '@abx-types/order'
import { getLastExecutedPrice, setLastExecutedPrice } from '../../order-match/last_executed_price_redis'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'

describe('last_executed_price_redis', () => {
  beforeEach(async function() {
    await getCacheClient().flush()
    await truncateTables()
  })

  after(async function() {
    await getCacheClient().flush()
    await truncateTables()
  })

  describe('getLastExecutedPrice', async function() {
    it('should get from redis', async function() {
      await getCacheClient().set('exchange:symbol:lastExecutedPrice:KAU_KAG', 4)
      const res = await getLastExecutedPrice('KAU_KAG')
      expect(res).to.eql(4)
    })
    it('should get from db', async function() {
      const account1 = await createTemporaryTestingAccount()
      const account2 = await createTemporaryTestingAccount()

      const order = await createDumbOrder(1, 2, account1.id, { id: 'KAU_KAG' }, OrderDirection.buy)
      const orderTwo = await createDumbOrder(1, 2, account2.id, { id: 'KAU_KAG' }, OrderDirection.sell)
      await createDumbOrderMatchTransaction(10, 12, account1.id, order.id, account2.id, orderTwo.id, { id: 'KAU_KAG' })
      const res = await getLastExecutedPrice('KAU_KAG')
      expect(res).to.eql(12)
    })
    it('should get from redis', async function() {
      const res = await getLastExecutedPrice('KAU_KAG')
      expect(res).to.eql(0)
    })
  })
  describe('setLastExecutedPrice', async function() {
    it('set value in redis', async function() {
      await setLastExecutedPrice('KAU_KAG', 10)
      const res = await getCacheClient().get('exchange:symbol:lastExecutedPrice:KAU_KAG')
      expect(res).to.eql(10)
    })
  })
})
