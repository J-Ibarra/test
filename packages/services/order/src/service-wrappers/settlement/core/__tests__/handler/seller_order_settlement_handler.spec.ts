import { expect } from 'chai'
import sinon from 'sinon'

import { SourceEventType } from '@abx-types/balance'
import * as balanceOperations from '@abx-service-clients/balance'
import * as boundaryOperations from '@abx-service-clients/reference-data'
import { sequelize } from '@abx-utils/db-connection-utils'
import * as coreOperations from '../../../../../core'
import { CurrencyCode } from '@abx-types/reference-data'
import { createOrderMatch, createSymbol } from './test_utils'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import { SellerOrderSettlementHandler } from '../../handler'

const boundary = 5
const symbolId = 'KAU_USD'
const fee = 0.2
const transactionId = 1
const orderAmount = 10
const orderMatchPrice = 6
const maxSellReserve = 10

describe('SellerOrderSettlementHandler', () => {
  const sellerOrderSettlementHandler = SellerOrderSettlementHandler.getInstance()
  let finaliseReserveStub
  let updateAvailableStub
  let buyerAccount
  let sellerAccount
  let orderMatch

  beforeEach(async () => {
    buyerAccount = await createTemporaryTestingAccount()
    sellerAccount = await createTemporaryTestingAccount()
    orderMatch = createOrderMatch(sellerAccount, buyerAccount, symbolId, orderAmount, orderMatchPrice)

    sinon.restore()
    sinon.stub(coreOperations, 'determineMaxReserveForTradeValue').callsFake(() => Promise.resolve(maxSellReserve))
    finaliseReserveStub = sinon.stub(balanceOperations, 'finaliseReserve').callsFake(() => Promise.resolve())
    updateAvailableStub = sinon.stub(balanceOperations, 'updateAvailable').callsFake(() => Promise.resolve())
    sinon.stub(boundaryOperations, 'findBoundaryForCurrency').callsFake(() => Promise.resolve({ maxDecimals: boundary }) as any)
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('releaseReserveBalance', () => {
    it('should release orderMatch amount + fee if fee taken from base currency', async () => {
      const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kvt, CurrencyCode.kau)

      await sequelize.transaction(async t => {
        await sellerOrderSettlementHandler.releaseReserveBalance(orderMatch, fee, symbol, transactionId, t)

        expect(
          finaliseReserveStub.calledWith({
            accountId: orderMatch.sellAccountId,
            amount: orderAmount + fee,
            currencyId: symbol.base.id,
            sourceEventId: transactionId,
            sourceEventType: SourceEventType.orderMatchRelease,
            initialReserve: maxSellReserve,
          }),
        ).to.eql(true)
      })
    })

    it('should release orderMatch amount if fee not taken from base currency', async () => {
      const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kvt, CurrencyCode.kvt)

      await sequelize.transaction(async t => {
        await sellerOrderSettlementHandler.releaseReserveBalance(orderMatch, fee, symbol, transactionId, t)

        expect(
          finaliseReserveStub.calledWith({
            accountId: orderMatch.sellAccountId,
            amount: orderAmount,
            currencyId: symbol.base.id,
            sourceEventId: transactionId,
            sourceEventType: SourceEventType.orderMatchRelease,
            initialReserve: orderAmount,
          }),
        ).to.eql(true)
      })
    })
  })

  describe('updateAvailableBalance', () => {
    it('should subtract fee from the total trade amount before updating available when fee taken from quote', async () => {
      const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kvt, CurrencyCode.kvt)

      await sellerOrderSettlementHandler.updateAvailableBalance(orderMatch, fee, symbol, transactionId)

      expect(
        updateAvailableStub.calledWith({
          accountId: orderMatch.sellAccountId,
          amount: orderAmount * orderMatchPrice - fee,
          currencyId: symbol.quote.id,
          sourceEventId: transactionId,
          sourceEventType: SourceEventType.orderMatch,
        }),
      ).to.eql(true)
    })

    it('should not subtract from the total trade amount before updating available when fee taken from base currency', async () => {
      const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kvt, CurrencyCode.kau)

      await sellerOrderSettlementHandler.updateAvailableBalance(orderMatch, fee, symbol, transactionId)

      expect(
        updateAvailableStub.calledWith({
          accountId: orderMatch.sellAccountId,
          amount: orderAmount * orderMatchPrice,
          currencyId: symbol.quote.id,
          sourceEventId: transactionId,
          sourceEventType: SourceEventType.orderMatch,
        }),
      ).to.eql(true)
    })
  })

  it('getAccountId should return sellAccountId', () => {
    const accountId = sellerOrderSettlementHandler.getAccountId(orderMatch)
    expect(accountId).to.eql(orderMatch.sellAccountId)
  })
})
