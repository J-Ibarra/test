import { expect } from 'chai'
import sinon, { SinonStub } from 'sinon'
import { TradeTransaction } from '@abx-types/order'
import * as accountOperations from '@abx-service-clients/account'
import { AccountStatus } from '@abx-types/account'
import { SourceEventType } from '@abx-types/balance'
import { sequelize } from '@abx-utils/db-connection-utils'
import { OrderDirection, OrderMatchStatus, OrderType, UsdMidPriceEnrichedOrderMatch } from '@abx-types/order'
import * as symbolOperations from '@abx-service-clients/reference-data'
import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import * as orderCore from '../../../../core'
import { BuyerOrderSettlementHandler, SellerOrderSettlementHandler } from '../handler'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import { OrderSettlementGateway } from '../order_settlement_gateway'
import * as balanceOperations from '@abx-service-clients/balance'

const quote = {
  id: 1,
  code: CurrencyCode.usd,
  sortPriority: 5,
  orderPriority: 1,
}
const base = {
  id: 2,
  code: CurrencyCode.kau,
  sortPriority: 2,
  orderPriority: 1,
}
const symbol = {
  id: 'KAU_USD',
  base,
  quote,
  fee: base,
  orderRange: 0.3,
}

const buyerFeeDetail = {
  fee: 0.2,
  feeRate: 0.01,
}
const buyerTax = {
  rate: 0.1,
  amount: (0.1 * 0.2) / 1.1,
}
const buyOrderId = 1
const buyTransactionId = 1

const sellerFeeDetail = {
  fee: 0.3,
  feeRate: 0.01,
}
const sellerTax = {
  rate: 0.1,
  amount: (0.1 * 0.3) / 1.1,
}
const sellOrderId = 2
const sellTransactionId = 2

const orderAmount = 10
const orderMatchPrice = 6

const buyerPreferredFiatCurrencyCode = FiatCurrency.usd
const buyerFiatConversionForQuote = 200
const buyerFiatConversionForBase = 211
const sellerPreferredFiatCurrencyCode = FiatCurrency.euro
const sellerFiatConversionForQuote = 10
const sellerFiatConversionForBase = 12

describe('OrderSettlementGateway', () => {
  const orderSettlementGateway = OrderSettlementGateway.getInstance()

  let buyerAccount
  let sellerAccount
  let operatorsAccount

  beforeEach(async () => {
    buyerAccount = await createTemporaryTestingAccount()
    sellerAccount = await createTemporaryTestingAccount()
    operatorsAccount = await createTemporaryTestingAccount()
    sinon.restore()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('settleOrderMatch should update buyer, seller and operator balances, monthly trade volume and set order match status to settled', async () => {
    const orderMatch = createOrderMatch(buyerAccount.id, sellerAccount.id)

    const [
      getCompleteSymbolDetailsStub,
      buyerCalculateFeeStub,
      buyerSettleOrderMatchStub,
      sellerCalculateFeeStub,
      sellerSettleOrderMatchStub,
      createTradeTransactionStub,
      findOrCreateOperatorAccountStub,
      operatorUpdateAvailable,
      incrementMonthlyTradeAccumulationStub,
      orderMatchRepositoryStub,
    ] = stubDependencies(buyerAccount.id, sellerAccount.id, operatorsAccount.id)

    await sequelize.transaction(async t => {
      await orderSettlementGateway.settleOrderMatch(orderMatch, t)
      expect(getCompleteSymbolDetailsStub.calledWith(symbol.id)).to.eql(true)
      expect(buyerCalculateFeeStub.calledWith(orderMatch, symbol, t)).to.eql(true)
      expect(sellerCalculateFeeStub.calledWith(orderMatch, symbol, t)).to.eql(true)

      expect(buyerSettleOrderMatchStub.calledWith(symbol, buyerFeeDetail.fee, buyTransactionId, orderMatch, t)).to.eql(true)
      expect(sellerSettleOrderMatchStub.calledWith(symbol, sellerFeeDetail.fee, sellTransactionId, orderMatch, t)).to.eql(true)
      expect(createTradeTransactionStub.calledOnce).to.eql(true)
      expect(findOrCreateOperatorAccountStub.calledOnce).to.eql(true)
      expect(
        operatorUpdateAvailable.calledWith({
          accountId: operatorsAccount.id,
          amount: buyerFeeDetail.fee + sellerFeeDetail.fee,
          currencyId: symbol.fee.id,
          sourceEventId: buyTransactionId,
          sourceEventType: SourceEventType.orderMatch,
        }),
      ).to.eql(true)
      expect(incrementMonthlyTradeAccumulationStub.getCalls().length).to.eql(2)
      expect(orderMatchRepositoryStub.calledWith(orderMatch.id, t)).to.eql(true)
    })
  })
})

const stubDependencies = (buyAccountId, sellAccountId, operatorsAccountId) => {
  return [
    sinon.stub(symbolOperations, 'getCompleteSymbolDetails').callsFake(() => Promise.resolve(symbol)),
    sinon.stub(BuyerOrderSettlementHandler.prototype, 'calculateFee').callsFake(() => Promise.resolve(buyerFeeDetail)),
    sinon.stub(BuyerOrderSettlementHandler.prototype, 'settleOrderMatch').callsFake(() => Promise.resolve()),
    sinon.stub(SellerOrderSettlementHandler.prototype, 'calculateFee').callsFake(() => Promise.resolve(sellerFeeDetail)),
    sinon.stub(SellerOrderSettlementHandler.prototype, 'settleOrderMatch').callsFake(() => Promise.resolve()),
    sinon
      .stub(orderCore, 'createTradeTransactionPair')
      .callsFake(() =>
        Promise.resolve([
          createTradeTransaction(buyTransactionId, buyAccountId, OrderDirection.buy),
          createTradeTransaction(sellTransactionId, sellAccountId, OrderDirection.sell),
        ]),
      ),
    sinon.stub(accountOperations, 'findOrCreateOperatorAccount').callsFake(() =>
      Promise.resolve({
        id: operatorsAccountId,
        status: AccountStatus.emailVerified,
        suspended: false,
      }),
    ),
    sinon.stub(balanceOperations, 'updateAvailable').callsFake(() => Promise.resolve()),
    sinon.stub(orderCore.AccountTradeVolumeAccumulator.prototype, 'incrementMonthlyTradeAccumulationForAccount').callsFake(() => Promise.resolve()),
    sinon.stub(orderCore.OrderMatchRepository.prototype, 'setOrderMatchStatusToSettled').callsFake(() => Promise.resolve()),
    sinon.stub(symbolOperations, 'findBoundaryForCurrency').resolves({ maxDecimals: 5 }),
    sinon.stub(symbolOperations, 'getCurrencyCode').resolves(CurrencyCode.usd),
    sinon.stub(OrderSettlementGateway.prototype, 'getPreferredCurrencyConversions' as any).callsFake(() =>
      Promise.resolve({
        buyerPreferredFiatCurrencyCode,
        buyerFiatConversionForQuote,
        buyerFiatConversionForBase,
        sellerPreferredFiatCurrencyCode,
        sellerFiatConversionForQuote,
        sellerFiatConversionForBase,
      }),
    ),
    sinon.stub(OrderSettlementGateway.prototype, 'calculateTax' as any).callsFake(() => Promise.resolve([buyerTax, sellerTax])),
  ] as SinonStub[]
}

const createOrderMatch = (buyAccountId, sellAccountId): UsdMidPriceEnrichedOrderMatch => ({
  id: 1,
  symbolId: symbol.id,
  amount: orderAmount,
  matchPrice: orderMatchPrice,
  consideration: 1,
  sellAccountId,
  sellOrderId,
  sellOrderType: OrderType.limit,
  buyAccountId,
  buyOrderId,
  buyOrderType: OrderType.limit,
  status: OrderMatchStatus.matched,
  feeCurrencyToUsdMidPrice: 12,
})

const createTradeTransaction = (id, accountId: string, direction: OrderDirection): TradeTransaction => ({
  id,
  counterTradeTransactionId: 1,
  direction,
  symbolId: symbol.id,
  accountId,
  orderId: 2,
  amount: 10,
  matchPrice: 20,
  fee: 2,
  feeRate: 0.01,
  feeCurrencyId: 1,
  taxRate: 0.077,
  taxAmountCHF: (0.077 * 2) / 1.077,
  taxAmountFeeCurrency: (0.077 * 2) / 1.077,
  fiatCurrencyCode: FiatCurrency.euro,
  quoteFiatConversion: 140,
  baseFiatConversion: 251,
})
