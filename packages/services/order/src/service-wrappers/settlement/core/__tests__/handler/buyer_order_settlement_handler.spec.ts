import { expect } from 'chai'
import sinon from 'sinon'
import { SourceEventType } from '@abx-types/balance'
import * as boundaryOperations from '@abx-service-clients/reference-data'
import * as balanceOperations from '@abx-service-clients/balance'
import { sequelize } from '@abx-utils/db-connection-utils'
import * as orderOperations from '../../../../../core'
import { OrderDirection } from '@abx-types/order'
import { CurrencyCode } from '@abx-types/reference-data'
import { BuyerOrderSettlementHandler } from '../../handler'
import * as sharedUtils from '../../handler/shared.utils'
import { createOrder, createOrderMatch, createSymbol } from './test_utils'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'

const boundary = 5
const symbolId = 'KAU_USD'
const fee = 0.2
const transactionId = 1
const orderAmount = 10
const orderMatchPrice = 6
const maxBuyerReserve = 10
const initialOrder = createOrder({
  orderId: 2,
  accountId: 'bar',
  symbolId: 'KAU_USD',
  direction: OrderDirection.sell,
  limitPrice: 12,
})

describe('BuyerOrderSettlementHandler', () => {
  const buyerOrderSettlementHandler = BuyerOrderSettlementHandler.getInstance()
  let orderMatch
  let finaliseReserveStub
  let updateAvailableStub
  let determineMaxBuyReserveStub
  let buyerAccount
  let sellerAccount

  beforeEach(async () => {
    sinon.restore()
    buyerAccount = await createTemporaryTestingAccount()
    sellerAccount = await createTemporaryTestingAccount()

    orderMatch = createOrderMatch(sellerAccount, buyerAccount, symbolId, orderAmount, orderMatchPrice)
    sinon.stub(orderOperations, 'findOrder').callsFake(() => Promise.resolve(initialOrder))
    determineMaxBuyReserveStub = sinon.stub(orderOperations, 'determineMaxBuyReserve').callsFake(() => Promise.resolve(maxBuyerReserve))
    finaliseReserveStub = sinon.stub(balanceOperations, 'finaliseReserve').callsFake(() => Promise.resolve())
    updateAvailableStub = sinon.stub(balanceOperations, 'updateAvailable').callsFake(() => Promise.resolve())
    sinon.stub(boundaryOperations, 'findBoundaryForCurrency').callsFake(() => Promise.resolve({ maxDecimals: boundary }) as any)
    sinon.stub(orderOperations, 'findOrderMatchTransactions').resolves([])
    sinon.stub(sharedUtils, 'retrieveTotalReleasedAmountForOrder').resolves(0)
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('releaseReserveBalance', () => {
    it('should release matchPrice * amount and use the initial order limitPrice for rebate when base is the fee currency', async () => {
      const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kvt, CurrencyCode.kau)

      await sequelize.transaction(async t => {
        await buyerOrderSettlementHandler.releaseReserveBalance(orderMatch, fee, symbol, transactionId, t)

        expect(
          finaliseReserveStub.calledWith({
            accountId: orderMatch.buyAccountId,
            amount: orderMatchPrice * orderAmount,
            currencyId: symbol.quote.id,
            sourceEventId: transactionId,
            sourceEventType: SourceEventType.orderMatchRelease,
            initialReserve: initialOrder.limitPrice! * orderAmount,
          }),
        ).to.eql(true)
      })
    })

    it('should release matchPrice * amount + fee when quote currency is the fee currency', async () => {
      const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kvt, CurrencyCode.kvt)

      await sequelize.transaction(async t => {
        await buyerOrderSettlementHandler.releaseReserveBalance(orderMatch, fee, symbol, transactionId, t)

        expect(
          finaliseReserveStub.calledWith({
            accountId: orderMatch.buyAccountId,
            amount: orderMatchPrice * orderAmount + fee,
            currencyId: symbol.quote.id,
            sourceEventId: transactionId,
            sourceEventType: SourceEventType.orderMatchRelease,
            initialReserve: maxBuyerReserve,
          }),
        ).to.eql(true)
        expect(
          determineMaxBuyReserveStub.calledWith({
            orderId: 2,
            price: initialOrder.limitPrice,
            amount: orderMatch.amount,
            accountId: orderMatch.buyAccountId,
            symbolId: orderMatch.symbolId,
            feeCurrencyCode: symbol.fee.code,
            maxDecimalsForCurrency: boundary,
            transaction: t,
          }),
        ).to.eql(true)
      })
    })
  })

  describe('updateAvailableBalance', () => {
    it('should update available amount for base currency with orderMatch amount if fee not taken from base', async () => {
      const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kvt, CurrencyCode.kvt)

      await buyerOrderSettlementHandler.updateAvailableBalance(orderMatch, fee, symbol, transactionId)

      expect(
        updateAvailableStub.calledWith({
          accountId: orderMatch.buyAccountId,
          amount: orderAmount,
          currencyId: symbol.base.id,
          sourceEventId: transactionId,
          sourceEventType: SourceEventType.orderMatch,
        }),
      ).to.eql(true)
    })

    it('should update available amount for base currency with (orderMatchAmount - fee) if fee taken from base', async () => {
      const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kvt, CurrencyCode.kau)

      await buyerOrderSettlementHandler.updateAvailableBalance(orderMatch, fee, symbol, transactionId)

      expect(
        updateAvailableStub.calledWith({
          accountId: orderMatch.buyAccountId,
          amount: orderAmount - fee,
          currencyId: symbol.base.id,
          sourceEventId: transactionId,
          sourceEventType: SourceEventType.orderMatch,
        }),
      ).to.eql(true)
    })
  })

  it('getAccountId should return buyAccountId', () => {
    const accountId = buyerOrderSettlementHandler.getAccountId(orderMatch)
    expect(accountId).to.eql(orderMatch.buyAccountId)
  })
})
