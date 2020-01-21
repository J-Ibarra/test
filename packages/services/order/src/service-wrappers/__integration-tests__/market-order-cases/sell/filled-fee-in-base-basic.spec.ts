import {
  USD,
  subscribeToDepthUpdateEvents,
  createTestTradingAccounts,
  KAG,
  stubBalanceReserveAdjustmentCalls,
  placeBuyLimitOrder,
  waitForBuyOrderToAppearInDepth,
  placeSellMarketOrder,
  verifyFeeAddedToOperatorAccount,
  verifyBuyOrderPresentInDepth,
  verifyTopOfBidDepthUpdatedEventDispatched,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import sinon from 'sinon'

describe('Market Order:Sell', async () => {
  let pair
  let updateAvailable

  beforeEach(async function() {
    this.timeout(10_000)
    const { symbol, updateAvailableStub } = await setUp({
      baseCurrency: KAG,
      quoteCurrency: USD,
      feeCurrency: KAG,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
  })

  it('Market Order - Filled (Full) - Within Available Balance - SELL (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: sellerId }, { accountId: buyerId }] = await createTestTradingAccounts(5)

    const buyOrder = await placeBuyLimitOrder({
      amount: 20,
      limitPrice: 45,
      buyerAccountId: buyerId,
      pair,
    })
    await waitForBuyOrderToAppearInDepth({ orderId: buyOrder.id, pair, account: buyerId })
    stubBalanceReserveAdjustmentCalls([{ orderId: buyOrder.id!, accountId: buyerId, currencyCode: USD.currency, expectedInitialReserve: 1 }])

    await placeSellMarketOrder({
      amount: 10,
      sellerAccountId: sellerId,
      pair,
      waitForSettlement: true,
    })

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.2, pair.fee.id)
    await verifyBuyOrderPresentInDepth({ orderId: buyOrder.id, pair, expectedRemaining: 10 })
    await verifyTopOfBidDepthUpdatedEventDispatched(45)
  }).timeout(60_000)

  afterEach(() => sinon.restore())
})
