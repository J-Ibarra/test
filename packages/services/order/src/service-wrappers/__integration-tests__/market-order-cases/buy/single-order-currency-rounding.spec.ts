import {
  placeSellLimitOrder,
  verifyFeeAddedToOperatorAccount,
  KAU,
  USD,
  subscribeToDepthUpdateEvents,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  waitForSellOrderToAppearInDepth,
  placeBuyMarketOrder,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Limit Order::Sell', async () => {
  let pair
  let updateAvailable: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, updateAvailableStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
  })

  it('Verify balances properly reserved and released with no precision errors', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: sellerId }, { accountId: buyerId }] = await createTestTradingAccounts(4)

    const sellOrder = await placeSellLimitOrder({
      amount: 10,
      limitPrice: 12,
      sellerAccountId: sellerId,
      pair,
    })
    await waitForSellOrderToAppearInDepth({ orderId: sellOrder.id, pair, account: sellerId })

    const buyOrder = await placeBuyMarketOrder({
      amount: 1.55,
      buyerAccountId: buyerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder.id!, accountId: buyerId, currencyCode: KAU.currency, expectedInitialReserve: 1.55 * sellOrder.limitPrice! },
    ])

    await waitForSettlement(buyOrder.id!, 'buy')
    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.031, pair.fee.id)
  }).timeout(60_000)
})
