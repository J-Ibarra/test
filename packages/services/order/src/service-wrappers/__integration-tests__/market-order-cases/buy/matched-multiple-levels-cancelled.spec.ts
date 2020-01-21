import {
  placeSellLimitOrder,
  USD,
  subscribeToDepthUpdateEvents,
  createTestTradingAccounts,
  waitForSellOrderToAppearInDepth,
  placeBuyMarketOrder,
  KAG,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Market Orders: Buy', async () => {
  let pair

  beforeEach(async function() {
    const { symbol } = await setUp({
      baseCurrency: KAG,
      quoteCurrency: USD,
      feeCurrency: KAG,
    })
    pair = symbol
  })

  it('Market Order - matches multiple levels - remaining cancelled', async () => {
    subscribeToDepthUpdateEvents()
    const [
      { accountId: seller1Id },
      { accountId: seller2Id },
      { accountId: seller3Id },
      { accountId: seller4Id },
      { accountId: buyerId },
    ] = await createTestTradingAccounts(5)

    const sellOrder1 = await placeSellLimitOrder({
      amount: 5,
      limitPrice: 20,
      sellerAccountId: seller1Id,
      pair,
    })
    const sellOrder2 = await placeSellLimitOrder({
      amount: 10.98765,
      limitPrice: 25,
      sellerAccountId: seller2Id,
      pair,
    })
    const sellOrder3 = await placeSellLimitOrder({
      amount: 10.65432,
      limitPrice: 30.25,
      sellerAccountId: seller3Id,
      pair,
    })
    const sellOrder4 = await placeSellLimitOrder({
      amount: 10.54321,
      limitPrice: 35.15,
      sellerAccountId: seller4Id,
      pair,
    })

    await waitForSellOrderToAppearInDepth({ orderId: sellOrder1.id, pair, account: seller1Id })
    await waitForSellOrderToAppearInDepth({ orderId: sellOrder2.id, pair, account: seller2Id })
    await waitForSellOrderToAppearInDepth({ orderId: sellOrder3.id, pair, account: seller3Id })
    await waitForSellOrderToAppearInDepth({ orderId: sellOrder4.id, pair, account: seller4Id })

    const buyMarketOrder = await placeBuyMarketOrder({
      amount: 80,
      buyerAccountId: buyerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([{ orderId: buyMarketOrder.id!, accountId: buyerId, currencyCode: USD.currency, expectedInitialReserve: 1 }])

    await waitForSettlement(buyMarketOrder.id!, 'buy')
  }).timeout(60_000)
})
