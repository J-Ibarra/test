import { expect } from 'chai'
import sinon from 'sinon'
import { Account, AccountType } from '@abx-types/account'
import * as referenceDataFunctions from '@abx-service-clients/reference-data'
import { OrderDirection, OrderType, OrderValidity } from '@abx-types/order'
import {
  getOrderRangeBoundariesForSymbol,
  isAccountBoundByOrderRange,
  validatePriceIfAccountBoundByOrderRange,
} from '../../last-executed-price-checks/order_validations'
import * as orderCoreOperations from '../../../../../core'
import * as executedPriceRedis from '../../../../../core/order-match/last_executed_price_redis'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import * as accountClient from '@abx-service-clients/account'

describe('order_validations', () => {
  let account: Account
  beforeEach(async function() {
    sinon.restore()
    await orderCoreOperations.setDefaultFeeTiers([{ tier: 1, symbolId: 'KAU_USD', rate: 0.01, threshold: 100_000 }])
    account = await createTemporaryTestingAccount()
    sinon.stub(referenceDataFunctions, 'getSymbolPairSummary').resolves({
      id: '',
      baseId: 3,
      quoteId: 2,
      feeId: 1,
      orderRange: 0.3,
    })
    sinon.stub(executedPriceRedis, 'getLastExecutedPrice').resolves(10)
    sinon.stub(accountClient, 'findAccountById').resolves(account)
    sinon.stub(referenceDataFunctions, 'getExcludedAccountTypesFromOrderRangeValidations').resolves([AccountType.admin])
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
      sinon.stub(referenceDataFunctions, 'getSymbolPairSummary').callsFake(() =>
        Promise.resolve({
          id: '',
          baseId: 3,
          quoteId: 2,
          feeId: 1,
          orderRange: 0.3,
        }),
      )
      sinon.stub(accountClient, 'findAccountById').resolves(account)
      sinon.stub(referenceDataFunctions, 'getExcludedAccountTypesFromOrderRangeValidations').resolves([AccountType.admin])
      sinon.stub(executedPriceRedis, 'getLastExecutedPrice').callsFake(() => Promise.resolve(0))
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
      sinon.restore()
      const adminAccount = await createTemporaryTestingAccount(AccountType.admin)

      sinon.stub(accountClient, 'findAccountById').resolves(adminAccount)
      sinon.stub(referenceDataFunctions, 'getExcludedAccountTypesFromOrderRangeValidations').resolves([AccountType.admin])

      const result = await isAccountBoundByOrderRange(adminAccount.id)
      expect(result).to.eql(false)
    })
  })
})
