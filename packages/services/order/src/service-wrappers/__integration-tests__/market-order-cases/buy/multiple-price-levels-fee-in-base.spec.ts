import {
  placeSellLimitOrder,
  USD,
  createTestTradingAccounts,
  waitForSellOrderToAppearInDepth,
  placeBuyMarketOrder,
  KAU,
  verifyFeeAddedToOperatorAccount,
  verifySellOrderPresentInDepth,
  stubBalanceReserveAdjustmentCalls,
  verifyTopOfAskDepthUpdatedEventDispatched,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { expect } from 'chai'
import { waitForSettlement } from '../../utils/settlement_waiter'
import { SourceEventType } from '@abx-types/balance'

describe('Market Orders: Buy', async () => {
  let pair
  let updateAvailable: sinon.SinonStub
  let reserveBalanceStub: sinon.SinonStub

  beforeEach(async function() {
    this.timeout(10_000)
    const { symbol, updateAvailableStub, balanceReserveStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
    reserveBalanceStub = balanceReserveStub
  })

  it('Market Order -Filled (Full) - Multiple Price Levels - BUY (fees in base)', async () => {
    const [{ accountId: buyerId }, { accountId: seller1Id }, { accountId: seller2Id }] = await createTestTradingAccounts(3)

    // Placing 2 orders in the ASK Depth
    const firstSellOrder = await placeSellLimitOrder({
      amount: 10,
      limitPrice: 55,
      sellerAccountId: seller1Id,
      pair,
    })
    const secondSellOrder = await placeSellLimitOrder({
      amount: 10,
      limitPrice: 60,
      sellerAccountId: seller2Id,
      pair,
    })
    await waitForSellOrderToAppearInDepth({ orderId: secondSellOrder.id, pair, account: seller2Id })
    await waitForSellOrderToAppearInDepth({ orderId: firstSellOrder.id, pair, account: seller1Id })

    const buyMarketOrder = await placeBuyMarketOrder({
      amount: 15,
      buyerAccountId: buyerId,
      pair,
      waitForSettlement: true,
    })
    stubBalanceReserveAdjustmentCalls([{ orderId: buyMarketOrder.id!, accountId: buyerId, currencyCode: USD.currency, expectedInitialReserve: 1 }])

    await waitForSettlement(buyMarketOrder.id!, 'buy')
    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.3, pair.fee.id)
    await verifySellOrderPresentInDepth({ orderId: secondSellOrder.id, pair, expectedRemaining: 5 })
    await verifyTopOfAskDepthUpdatedEventDispatched(60)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: USD.id,
        accountId: buyMarketOrder.accountId,
        amount: firstSellOrder.amount * firstSellOrder.limitPrice!,
        sourceEventId: buyMarketOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: USD.id,
        accountId: buyMarketOrder.accountId,
        amount: 5 * secondSellOrder.limitPrice!,
        sourceEventId: buyMarketOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
