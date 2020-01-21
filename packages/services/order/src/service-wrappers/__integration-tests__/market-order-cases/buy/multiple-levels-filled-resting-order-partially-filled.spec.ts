import {
  placeSellLimitOrder,
  verifyFeeAddedToOperatorAccount,
  subscribeToDepthUpdateEvents,
  createTestTradingAccounts,
  waitForSellOrderToAppearInDepth,
  placeBuyMarketOrder,
  ETH,
  EUR,
  placeBuyLimitOrder,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Market Orders: Buy', async () => {
  let pair
  let updateAvailable: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, updateAvailableStub } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: EUR,
      feeCurrency: ETH,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
  })

  // This test replicates a reserve balance issue observed on settlement
  it('Market Order - Filled (Full) - Resting order partially filled - Multiple Price Levels - BUY (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [
      { accountId: seller1Id },
      { accountId: seller2Id },
      { accountId: partiallyFilledOrderBuyer },
      { accountId: buyerId },
    ] = await createTestTradingAccounts(4)

    // Placing 3 orders in the ASK Depth, first one partially filled
    await placeSellLimitOrder({
      amount: 5.987654,
      limitPrice: 173.05,
      sellerAccountId: seller1Id,
      pair,
    })

    await placeBuyLimitOrder({
      amount: 5.1801,
      limitPrice: 173.05,
      buyerAccountId: partiallyFilledOrderBuyer,
      pair,
    })

    await placeSellLimitOrder({
      amount: 10.123456,
      limitPrice: 173.05,
      sellerAccountId: seller1Id,
      pair,
    })
    const secondSellOrder = await placeSellLimitOrder({
      amount: 10.123456,
      limitPrice: 173.1,
      sellerAccountId: seller2Id,
      pair,
    })
    await waitForSellOrderToAppearInDepth({ orderId: secondSellOrder.id, pair, account: seller2Id })

    const marketOrder = await placeBuyMarketOrder({
      amount: 15,
      buyerAccountId: buyerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([{ orderId: marketOrder.id!, accountId: buyerId, currencyCode: EUR.currency, expectedInitialReserve: 1 }])

    await waitForSettlement(marketOrder.id!, 'buy')
    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.299999, pair.fee.id)
  }).timeout(60_000)
})
