import { expect } from 'chai'
import {
  cancelOrder,
  createTestTradingAccounts,
  placeBuyLimitOrder,
  waitForOrderToAppearInBuyDepth,
  ETH,
  KAG,
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

  it('Limit Order Buy - submit - cancelled - fee taken from quote', async function() {
    const [{ accountId: buyerId }] = await createTestTradingAccounts()

    const buyOrder = await placeBuyLimitOrder({ amount: 1.5, limitPrice: 186.45, buyerAccountId: buyerId, pair })

    await waitForOrderToAppearInBuyDepth(pair, buyOrder.id!)

    const expectedInitialReserve = new Decimal(buyOrder.amount)
      .times(buyOrder.limitPrice!)
      .times(1 + DEFAULT_TEST_FEE_RATE)
      .toDP(KAG.boundary!.maxDecimals, Decimal.ROUND_DOWN)
      .toNumber()

    stubBalanceReserveAdjustmentCalls([{ orderId: buyOrder.id!, accountId: buyerId, currencyCode: KAG.currency, expectedInitialReserve }])
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
        amount: expectedInitialReserve,
        sourceEventId: buyOrder.id!,
        sourceEventType: SourceEventType.orderCancellation,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
