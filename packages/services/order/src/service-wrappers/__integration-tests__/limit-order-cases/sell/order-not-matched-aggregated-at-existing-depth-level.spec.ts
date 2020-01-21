import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  KAU,
  subscribeToDepthUpdateEvents,
  USD,
  waitForOrderToAppearInSellDepth,
  verifySellOrderPresentInDepth,
  verifyTopOfAskDepthUpdatedEventDispatched,
  verifyTopOfBidDepthUpdatedEventDispatched,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'

describe('Limit Order::Sell', async () => {
  let pair

  beforeEach(async function() {
    const { symbol } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
  })

  it('Limit Order - Resting (Full) - No Reference Price Change - Aggregate at Existing Depth Level - SELL (fees in quote)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyerId }, { accountId: sellerId1 }, { accountId: sellerId2 }, { accountId: sellerId }] = await createTestTradingAccounts(4)

    await placeBuyLimitOrder({ amount: 10, limitPrice: 15, buyerAccountId: buyerId, pair })

    await placeSellLimitOrder({ amount: 10, limitPrice: 20, sellerAccountId: sellerId1, pair })
    await placeSellLimitOrder({ amount: 10, limitPrice: 25, sellerAccountId: sellerId2, pair })

    const sellOrder = await placeSellLimitOrder({
      amount: 10,
      limitPrice: 20,
      sellerAccountId: sellerId,
      pair,
    })

    await waitForOrderToAppearInSellDepth(pair, sellOrder.id!)

    await verifySellOrderPresentInDepth({ orderId: sellOrder.id, pair, expectedRemaining: 10 })
    await verifyTopOfBidDepthUpdatedEventDispatched(15)
    await verifyTopOfAskDepthUpdatedEventDispatched(20)
  }).timeout(60_000)
})
