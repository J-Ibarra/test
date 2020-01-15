import { expect } from 'chai'
import sinon from 'sinon'
import { Account, AccountType } from '@abx-types/account'
import { SymbolPair } from '@abx-types/reference-data'
import * as symbolFunctions from '@abx-service-clients/reference-data'
import { OrderDirection, OrderType, OrderValidity } from '@abx-types/order'
import {
  getOrderRangeBoundariesForSymbol,
  isAccountBoundByOrderRange,
  validatePriceIfAccountBoundByOrderRange,
} from '../../last-executed-price-checks/order_validations'
import * as orderCoreOperations from '../../../../../core'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'

describe('order_validations', () => {
  let pair: SymbolPair
  let account: Account
  beforeEach(async function() {
    await orderCoreOperations.setDefaultFeeTiers([{ tier: 1, symbolId: pair.id, rate: 0.01, threshold: 100_000 }])
    account = await createTemporaryTestingAccount()
    sinon.restore()
    sinon.stub(symbolFunctions, 'getSymbolPairSummary').callsFake(() =>
      Promise.resolve({
        id: '',
        baseId: 3,
        quoteId: 2,
        feeId: 1,
        orderRange: 0.3,
      }),
    )
    sinon.stub(orderCoreOperations, 'getLastExecutedPrice').callsFake(() => Promise.resolve(10))
  })

  after(async function() {
    sinon.restore()
  })

  describe('validatePriceIfAccountBoundByOrderRange', async function() {
    it('passes - within boundary', async function() {
      let result
      try {
        await validatePriceIfAccountBoundByOrderRange({
          accountId: account.id,
          orderType: OrderType.limit,
          symbolId: 'KAU_USD',
          limitPrice: 11,
          amount: 1,
          direction: OrderDirection.buy,
          validity: OrderValidity.GTC,
        })
        result = true
      } catch (e) {
        result = false
      }
      expect(result).to.eql(true)
    })
    it('fails - it is below boundary', async function() {
      let result
      try {
        await validatePriceIfAccountBoundByOrderRange({
          accountId: account.id,
          orderType: OrderType.limit,
          symbolId: 'KAU_USD',
          limitPrice: 6,
          amount: 1,
          direction: OrderDirection.buy,
          validity: OrderValidity.GTC,
        })
        result = true
      } catch (e) {
        expect(e.message).to.eql('Order request cannot be placed as it falls outside of the order range')
        result = false
      }
      expect(result).to.eql(false)
    })
    it('fails - it is above the boundary', async function() {
      let result
      try {
        await validatePriceIfAccountBoundByOrderRange({
          accountId: account.id,
          orderType: OrderType.limit,
          symbolId: 'KAU_USD',
          limitPrice: 14,
          amount: 1,
          direction: OrderDirection.buy,
          validity: OrderValidity.GTC,
        })
        result = true
      } catch (e) {
        expect(e.message).to.eql('Order request cannot be placed as it falls outside of the order range')
        result = false
      }
      expect(result).to.eql(false)
    })
    it('passes - no order matches so it continues', async function() {
      sinon.restore()
      sinon.stub(symbolFunctions, 'getSymbolPairSummary').callsFake(() =>
        Promise.resolve({
          id: '',
          baseId: 3,
          quoteId: 2,
          feeId: 1,
          orderRange: 0.3,
        }),
      )
      sinon.stub(orderCoreOperations, 'getLastExecutedPrice').callsFake(() => Promise.resolve(0))
      let result
      try {
        await validatePriceIfAccountBoundByOrderRange({
          accountId: account.id,
          orderType: OrderType.limit,
          symbolId: 'KAU_USD',
          limitPrice: 50,
          amount: 1,
          direction: OrderDirection.buy,
          validity: OrderValidity.GTC,
        })
        result = true
      } catch (e) {
        result = false
      }
      expect(result).to.eql(true)
    })
  })
  describe('getOrderRangeBoundariesForSymbol', async function() {
    it('returns correct amount', async function() {
      const result = getOrderRangeBoundariesForSymbol(0.3, 10)
      expect(result.lowerBounds).to.eql(7)
      expect(result.upperBounds).to.eql(13)
    })
  })

  describe('isAccountBoundByOrderRange', async function() {
    it('returns true - is not an admin account', async function() {
      const result = await isAccountBoundByOrderRange(account.id)
      expect(result).to.eql(true)
    })
    it('returns false - is an admin', async function() {
      account = await createTemporaryTestingAccount(AccountType.admin)
      const result = await isAccountBoundByOrderRange(account.id)
      expect(result).to.eql(false)
    })
  })
})
