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
  verifySellOrderPresentInDepth,
  verifyTopOfAskDepthUpdatedEventDispatched,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Market Orders: Buy', async () => {
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

  it('Market Order - Filled (Full) - Within Available Balance - Time Priority - Price D.P. Validation [quote currency] - BUY (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: seller1Id }, { accountId: seller2Id }, { accountId: buyerId }] = await createTestTradingAccounts(4)

    // Placing 2 orders in the ASK Depth
    const firstSellOrder = await placeSellLimitOrder({ amount: 10, limitPrice: 55, sellerAccountId: seller1Id, pair })
    const secondSellOrder = await placeSellLimitOrder({
      amount: 10,
      limitPrice: 55,
      sellerAccountId: seller2Id,
      pair,
    })
    await waitForSellOrderToAppearInDepth({ orderId: secondSellOrder.id, pair, account: seller2Id })

    const buyMarketOrder = await placeBuyMarketOrder({
      amount: 10,
      buyerAccountId: buyerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([
      {
        orderId: buyMarketOrder.id!,
        accountId: buyMarketOrder.accountId,
        currencyCode: USD.currency,
        expectedInitialReserve: buyMarketOrder.amount * firstSellOrder.limitPrice!,
      },
    ])

    await waitForSettlement(buyMarketOrder.id!, 'buy')
    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.2, pair.fee.id)
    await verifySellOrderPresentInDepth({
      orderId: secondSellOrder.id,
      pair,
      expectedRemaining: 10,
    })
    await verifyTopOfAskDepthUpdatedEventDispatched(55)
  }).timeout(60_000)
})
