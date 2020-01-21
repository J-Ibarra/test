import {
  cancelOrder,
  createTestTradingAccounts,
  placeBuyLimitOrder,
  placeSellLimitOrder,
  waitForOrderToAppearInBuyDepth,
  ETH,
  USD,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { expect } from 'chai'
import Decimal from '@abx-types/order/node_modules/decimal.js'
import { SourceEventType } from '@abx-types/balance'

describe('Limit Orders: Buy', () => {
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

  it('Limit Order Buy - partially filled - cancelled - fee taken from base ', async function() {
    const [{ accountId: buyerId }, { accountId: seller1Id }, { accountId: seller2Id }] = await createTestTradingAccounts(3)

    const buyOrder = await placeBuyLimitOrder({ amount: 1.5, limitPrice: 186.45, buyerAccountId: buyerId, pair })

    await waitForOrderToAppearInBuyDepth(pair, buyOrder.id!)

    await placeSellLimitOrder({ amount: 0.000055, limitPrice: 186.45, sellerAccountId: seller1Id, pair, waitForSettlement: true })
    await placeSellLimitOrder({ amount: 1.4, limitPrice: 186.45, sellerAccountId: seller2Id, pair, waitForSettlement: true })

    const expectedInitialBuyReserve = new Decimal(buyOrder.amount)
      .times(buyOrder.limitPrice!)
      .toDP(USD.boundary!.maxDecimals, Decimal.ROUND_DOWN)
      .toNumber()

    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder.id!, accountId: buyerId, currencyCode: USD.currency, expectedInitialReserve: expectedInitialBuyReserve },
    ])
    await cancelOrder(buyOrder, true)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.quote.id,
        accountId: buyOrder.accountId,
        amount: expectedInitialBuyReserve,
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    const remainingAmount = new Decimal(0.000055 + 1.4)
      .times(buyOrder.limitPrice!)
      .toDP(USD.boundary!.maxDecimals, Decimal.ROUND_DOWN)
      .toNumber()
    expect(
      releaseReserveStub.calledWith({
        currencyId: pair.quote.id,
        accountId: buyOrder.accountId,
        amount: new Decimal(expectedInitialBuyReserve)
          .minus(remainingAmount)
          .toDP(USD.boundary!.maxDecimals, Decimal.ROUND_DOWN)
          .toNumber(),
        sourceEventId: buyOrder.id!,
        sourceEventType: SourceEventType.orderCancellation,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
