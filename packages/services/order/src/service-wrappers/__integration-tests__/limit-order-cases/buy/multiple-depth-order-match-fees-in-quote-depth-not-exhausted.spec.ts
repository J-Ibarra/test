import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  verifySellOrderPresentInDepth,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  ETH,
  KAU,
  subscribeToDepthUpdateEvents,
  verifyTopOfAskDepthUpdatedEventDispatched,
} from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import { expect } from 'chai'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'
import Decimal from 'decimal.js'
import { SourceEventType } from '@abx-types/balance'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Limit Orders: Buy', async () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let updateAvailable: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, updateAvailableStub } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: KAU,
      feeCurrency: KAU,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    updateAvailable = updateAvailableStub
  })

  it('Limit Order - Filled (Full) - Multiple Order Match - Multiple Depth Levels - Leave Resting Depth - BUY (fees in quote)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyerId }, { accountId: seller1Id }, { accountId: seller2Id }, { accountId: seller3Id }] = await createTestTradingAccounts(4)

    await placeSellLimitOrder({ amount: 10, limitPrice: 20, sellerAccountId: seller1Id, pair })
    await placeSellLimitOrder({ amount: 10, limitPrice: 25, sellerAccountId: seller2Id, pair })
    const lastSellOrder = await placeSellLimitOrder({
      amount: 10,
      limitPrice: 30,
      sellerAccountId: seller3Id,
      pair,
    })

    const buyOrder = await placeBuyLimitOrder({
      amount: 25,
      limitPrice: 30,
      buyerAccountId: buyerId,
      pair,
    })

    const expectedInitialReserve = new Decimal(buyOrder.amount)
      .times(buyOrder.limitPrice!)
      .times(1 + DEFAULT_TEST_FEE_RATE)
      .toDP(KAU.boundary!.maxDecimals, Decimal.ROUND_DOWN)
      .toNumber()
    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder.id!, accountId: buyerId, currencyCode: KAU.currency, expectedInitialReserve: expectedInitialReserve },
    ])

    await waitForSettlement(buyOrder.id!, 'buy')
    await verifyFeeAddedToOperatorAccount(updateAvailable, 12, pair.fee.id)
    await verifySellOrderPresentInDepth({ orderId: lastSellOrder.id, pair, expectedRemaining: 5 })
    await verifyTopOfAskDepthUpdatedEventDispatched(30)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.quote.id,
        accountId: buyOrder.accountId,
        amount: expectedInitialReserve,
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
