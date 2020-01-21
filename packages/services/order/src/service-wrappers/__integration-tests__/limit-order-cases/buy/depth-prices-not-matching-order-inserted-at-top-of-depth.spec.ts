import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  KAU,
  USD,
  waitForSellOrderToAppearInDepth,
  waitForBuyOrderToAppearInDepth,
  waitForOrderToAppearInSellDepth,
  verifyTopOfBidDepthUpdatedEventDispatched,
  verifyTopOfAskDepthUpdatedEventDispatched,
  subscribeToDepthUpdateEvents,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { expect } from 'chai'
import { SourceEventType } from '@abx-types/balance'

describe('Limit Orders: Buy', async () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
  })

  it('Limit Order - Resting (Full) - No Reference Price Change - New Depth Level - BUY (fees in base)', async function() {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyerId }, { accountId: sellerId }] = await createTestTradingAccounts(2)

    const sellOrder = await placeSellLimitOrder({ amount: 20, limitPrice: 30, sellerAccountId: sellerId, pair })
    await waitForOrderToAppearInSellDepth(pair, sellOrder.id!)

    const buyOrder = await placeBuyLimitOrder({
      amount: 10,
      limitPrice: 18,
      buyerAccountId: buyerId,
      pair,
    })
    await waitForSellOrderToAppearInDepth({ orderId: sellOrder.id, pair, account: sellerId })
    await waitForBuyOrderToAppearInDepth({ orderId: buyOrder.id, pair, account: buyerId })

    await verifyTopOfBidDepthUpdatedEventDispatched(buyOrder.limitPrice!)
    await verifyTopOfAskDepthUpdatedEventDispatched(sellOrder.limitPrice!)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: USD.id,
        accountId: buyOrder.accountId,
        amount: buyOrder.amount * buyOrder.limitPrice!,
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
