import { cancelOrder, placeSellLimitOrder, ETH, USD, createTestTradingAccounts, stubBalanceReserveAdjustmentCalls } from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import { expect } from 'chai'
import Decimal from 'decimal.js'
import { SourceEventType } from '@abx-types/balance'

describe('Limit Orders: Sell', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let releaseReserveStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, releaseReserve } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: USD,
      feeCurrency: ETH,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    releaseReserveStub = releaseReserve
  })

  it('Limit Order Sell - not partially filled - cancelled - fee taken from base ', async function() {
    const [{ accountId: sellerId }] = await createTestTradingAccounts()

    const sellOrder = await placeSellLimitOrder({ amount: 65, limitPrice: 36.31, sellerAccountId: sellerId, pair })

    const expectedInitialReserve = new Decimal(sellOrder.amount)
      .times(1 + DEFAULT_TEST_FEE_RATE)
      .toDP(2, Decimal.ROUND_DOWN)
      .toNumber()

    stubBalanceReserveAdjustmentCalls([
      {
        orderId: sellOrder.id!,
        accountId: sellOrder.accountId,
        currencyCode: ETH.currency,
        expectedInitialReserve: expectedInitialReserve,
      },
    ])
    await cancelOrder(sellOrder, true)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.base.id,
        accountId: sellOrder.accountId,
        amount: expectedInitialReserve,
        sourceEventId: sellOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    expect(
      releaseReserveStub.calledWith({
        currencyId: pair.base.id,
        accountId: sellOrder.accountId,
        amount: expectedInitialReserve,
        sourceEventId: sellOrder.id!,
        sourceEventType: SourceEventType.orderCancellation,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
