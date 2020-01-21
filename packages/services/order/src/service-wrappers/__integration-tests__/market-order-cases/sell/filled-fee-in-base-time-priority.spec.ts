import {
  USD,
  subscribeToDepthUpdateEvents,
  createTestTradingAccounts,
  placeBuyLimitOrder,
  placeSellMarketOrder,
  verifyFeeAddedToOperatorAccount,
  verifyBuyOrderPresentInDepth,
  KAU,
  verifyTopOfBidDepthUpdatedEventDispatched,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'

describe('Market Order:Sell', async () => {
  let pair
  let updateAvailable

  beforeEach(async function() {
    const { symbol, updateAvailableStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
  })

  it('Market Order - Filled (Full) - Within Available Balance - Time Priority - Price D.P. Validation [quote currency] - SELL (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: sellerId }, { accountId: buyer1Id }, { accountId: buyer2Id }] = await createTestTradingAccounts(5)

    // Placing 2 orders in the BID Depth
    const buyOrder = await placeBuyLimitOrder({ amount: 10, limitPrice: 45, buyerAccountId: buyer1Id, pair })
    const secondBuyOrder = await placeBuyLimitOrder({
      amount: 10,
      limitPrice: 45,
      buyerAccountId: buyer2Id,
      pair,
    })
    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder.id!, accountId: buyOrder.accountId, currencyCode: USD.currency, expectedInitialReserve: 1 },
    ])

    await placeSellMarketOrder({
      amount: 10,
      sellerAccountId: sellerId,
      pair,
      waitForSettlement: true,
    })

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.2, pair.fee.id)
    await verifyBuyOrderPresentInDepth({
      orderId: secondBuyOrder.id,
      pair,
      expectedRemaining: 10,
    })
    await verifyTopOfBidDepthUpdatedEventDispatched(45)
  }).timeout(60_000)
})
