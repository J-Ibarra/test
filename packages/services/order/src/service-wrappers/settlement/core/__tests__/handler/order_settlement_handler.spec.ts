import { expect } from 'chai'
import Decimal from 'decimal.js'
import sinon from 'sinon'
import { findBoundaryForCurrency } from '@abx-service-clients/reference-data'
import { sequelize, wrapInTransaction, truncateTables } from '@abx/db-connection-utils'
import * as coreOperations from '../../../../../core'
import { CurrencyCode } from '@abx-types/reference-data'
import { createOrderMatch, createSymbol } from './test_utils'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import { BuyerOrderSettlementHandler } from '../../handler'

const symbolId = 'KAU_KAG'

const orderAmount = 10
const orderMatchPrice = 6
const feeRate = 0.2

describe('OrderSettlementHandler', () => {
  const orderSettlementHandler = BuyerOrderSettlementHandler.getInstance()
  let getFeeRateForAccountStub
  let orderMatch
  let buyerAccount
  let sellerAccount

  beforeEach(async () => {
    truncateTables()
    buyerAccount = await createTemporaryTestingAccount()
    sellerAccount = await createTemporaryTestingAccount()
    orderMatch = createOrderMatch(sellerAccount.id, buyerAccount.id, symbolId, 10, 5)
    sinon.restore()
    getFeeRateForAccountStub = sinon.stub(coreOperations, 'getFeeRateForAccount').callsFake(() => Promise.resolve(feeRate))
  })

  afterEach(() => {
    sinon.restore()
  })
  after(() => {
    truncateTables()
  })
  describe('calculateFee', () => {
    it('should multiply orderMatch amount * feeRate when base currency is fee currency', async () => {
      const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kag, CurrencyCode.kau)
      const { maxDecimals } = await findBoundaryForCurrency(CurrencyCode.kau)
      await calculateFeeAndVerifyFeeMatchesExpected(symbol, {
        fee: new Decimal(orderAmount)
          .times(feeRate)
          .toDP(maxDecimals, Decimal.ROUND_DOWN)
          .toNumber(),
        feeRate,
      })
    })

    it('should calculate (orderMatch amount * match price * feeRate) when quote currency is fee currency', async () => {
      const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kag, CurrencyCode.kau)
      const { maxDecimals } = await findBoundaryForCurrency(CurrencyCode.kau)

      calculateFeeAndVerifyFeeMatchesExpected(
        symbol,
        new Decimal(orderAmount)
          .times(orderMatchPrice)
          .times(feeRate)
          .toDP(maxDecimals, Decimal.ROUND_DOWN)
          .toNumber(),
      )
    })

    const calculateFeeAndVerifyFeeMatchesExpected = (symbol, expectedFee) => {
      return wrapInTransaction(sequelize, null, async t => {
        const fee = await orderSettlementHandler.calculateFee(orderMatch, symbol, t)

        expect(
          getFeeRateForAccountStub.calledWith(
            {
              accountId: orderMatch.buyAccountId,
              symbolId: symbol.id,
            },
            t,
          ),
        )

        expect(fee).to.eql(expectedFee)
      })
    }
  })
})
