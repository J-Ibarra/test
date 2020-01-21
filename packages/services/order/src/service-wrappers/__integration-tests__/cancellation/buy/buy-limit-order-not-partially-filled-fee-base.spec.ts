import { expect } from 'chai'
import { Decimal } from 'decimal.js'
import {
  cancelOrder,
  createTestTradingAccounts,
  placeBuyLimitOrder,
  waitForOrderToAppearInBuyDepth,
  setUp,
  ETH,
  USD,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
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

  it('Limit Order Buy - submit - cancelled - fee taken from base ', async function() {
    const [{ accountId: buyerId }] = await createTestTradingAccounts()

    const buyOrder = await placeBuyLimitOrder({ amount: 1.5, limitPrice: 186.45, buyerAccountId: buyerId, pair })

    await waitForOrderToAppearInBuyDepth(pair, buyOrder.id!)

    const expectedInitialReserve = new Decimal(buyOrder.amount)
      .times(buyOrder.limitPrice!)
      .toDP(2, Decimal.ROUND_DOWN)
      .toNumber()

    stubBalanceReserveAdjustmentCalls([{ orderId: buyOrder.id!, accountId: buyerId, currencyCode: USD.currency, expectedInitialReserve }])
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
