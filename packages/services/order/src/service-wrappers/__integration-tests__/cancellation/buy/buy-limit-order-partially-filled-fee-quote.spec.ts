import { expect } from 'chai'
import {
  cancelOrder,
  placeBuyLimitOrder,
  placeSellLimitOrder,
  ETH,
  KAG,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import Decimal from '@abx-types/order/node_modules/decimal.js'
import { SourceEventType } from '@abx-types/balance'

describe('Limit Orders: Buy', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let releaseReserveStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, releaseReserve } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: KAG,
      feeCurrency: KAG,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    releaseReserveStub = releaseReserve
  })

  it('Limit Order - Resting (Full) - ensure reserved is correct - ensure cancelled reserved is updated', async function() {
    const [{ accountId: buyerId }, { accountId: seller1Id }, { accountId: seller2Id }, { accountId: seller3Id }] = await createTestTradingAccounts(4)

    const buyOrder = await placeBuyLimitOrder({ amount: 65, limitPrice: 36.65432, buyerAccountId: buyerId, pair })

    await placeSellLimitOrder({ amount: 9, limitPrice: 36.65432, sellerAccountId: seller1Id, pair, waitForSettlement: true })
    await placeSellLimitOrder({ amount: 9, limitPrice: 36.65432, sellerAccountId: seller2Id, pair, waitForSettlement: true })
    await placeSellLimitOrder({ amount: 44, limitPrice: 36.65432, sellerAccountId: seller3Id, pair, waitForSettlement: true })

    const expectedInitialReserve = new Decimal(buyOrder.amount)
      .times(buyOrder.limitPrice!)
      .times(1 + DEFAULT_TEST_FEE_RATE)
      .toDP(KAG.boundary!.maxDecimals, Decimal.ROUND_DOWN)
      .toNumber()

    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder.id!, accountId: buyerId, currencyCode: KAG.currency, expectedInitialReserve: expectedInitialReserve },
    ])
    await cancelOrder(buyOrder, true)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.quote.id,
        accountId: buyOrder.accountId,
        amount: expectedInitialReserve,
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    expect(
      releaseReserveStub.calledWith({
        currencyId: pair.quote.id,
        accountId: buyOrder.accountId,
        amount: 111.062592,
        sourceEventId: buyOrder.id!,
        sourceEventType: SourceEventType.orderCancellation,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
