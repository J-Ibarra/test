import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  waitForOrderToAppearInBuyDepth,
  createTestTradingAccounts,
  KAU,
  USD,
  verifyBuyOrderAtDepthLevel,
  subscribeToDepthUpdateEvents,
  verifyTopOfAskDepthUpdatedEventDispatched,
  verifyTopOfBidDepthUpdatedEventDispatched,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { SourceEventType } from '@abx-types/balance'
import { expect } from 'chai'

describe('Limit Orders: Buy', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: USD,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
  })

  it('Limit Order - Resting (Full) - Reference Price Change - BUY (fees in base)', async function() {
    subscribeToDepthUpdateEvents()
    const [
      { accountId: mainBuyer },
      { accountId: buyer1 },
      { accountId: buyer2 },
      { accountId: buyer3 },
      { accountId: sellerId },
    ] = await createTestTradingAccounts(5)

    await placeSellLimitOrder({ amount: 10, limitPrice: 20, sellerAccountId: sellerId, pair })

    const buyOrder1 = await placeBuyLimitOrder({ amount: 10, limitPrice: 15, buyerAccountId: buyer1, pair })
    const buyOrder2 = await placeBuyLimitOrder({ amount: 10, limitPrice: 10, buyerAccountId: buyer2, pair })
    const buyOrder3 = await placeBuyLimitOrder({ amount: 10, limitPrice: 5, buyerAccountId: buyer3, pair })

    const mainBuyerOrder = await placeBuyLimitOrder({
      amount: 10,
      limitPrice: 14,
      buyerAccountId: mainBuyer,
      pair,
    })
    await waitForOrderToAppearInBuyDepth(pair, mainBuyerOrder.id!)

    await verifyBuyOrderAtDepthLevel({
      orderId: mainBuyerOrder.id,
      pair,
      expectedRemaining: 10,
      level: 1,
    })
    await verifyTopOfBidDepthUpdatedEventDispatched(15)
    await verifyTopOfAskDepthUpdatedEventDispatched(20)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: USD.id,
        accountId: mainBuyerOrder.accountId,
        amount: mainBuyerOrder.amount * mainBuyerOrder.limitPrice!,
        sourceEventId: mainBuyerOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    )
    expect(
      reserveBalanceStub.calledWith({
        currencyId: USD.id,
        accountId: buyOrder1.accountId,
        amount: buyOrder1.amount * buyOrder1.limitPrice!,
        sourceEventId: buyOrder1.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    )
    expect(
      reserveBalanceStub.calledWith({
        currencyId: USD.id,
        accountId: buyOrder2.id,
        amount: buyOrder2.amount * buyOrder2.limitPrice!,
        sourceEventId: buyOrder2.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    )
    expect(
      reserveBalanceStub.calledWith({
        currencyId: USD.id,
        accountId: buyOrder3.accountId,
        amount: buyOrder3.amount * buyOrder3.limitPrice!,
        sourceEventId: buyOrder3.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    )
  }).timeout(60_000)
})
