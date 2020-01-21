import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  KAU,
  verifyFeeAddedToOperatorAccount,
  verifySellOrderPresentInDepth,
  verifyTopOfAskDepthUpdatedEventDispatched,
  verifyTopOfBidDepthUpdatedEventDispatched,
  subscribeToDepthUpdateEvents,
  USD,
  verifyBuyOrderPresentInDepth,
} from '../../utils'
import { expect } from 'chai'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import { SourceEventType } from '@abx-types/balance'
import Decimal from 'decimal.js'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Limit Order::Sell', async () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let updateAvailable: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, updateAvailableStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    updateAvailable = updateAvailableStub
  })

  it('Limit Order - Filled (Full) - Single Order Match  - Hit Own Order - SELL (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: sellerId }, { accountId: buyerId }] = await createTestTradingAccounts(4)

    const sellerBuyOrder = await placeBuyLimitOrder({
      amount: 20,
      limitPrice: 25,
      buyerAccountId: sellerId,
      pair,
    })
    const buyerBuyOrder = await placeBuyLimitOrder({
      amount: 10,
      limitPrice: 20,
      buyerAccountId: buyerId,
      pair,
    })

    const sellerSellOrder = await placeSellLimitOrder({
      amount: 20,
      limitPrice: 20,
      sellerAccountId: sellerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([
      { orderId: buyerBuyOrder.id!, accountId: buyerBuyOrder.accountId, currencyCode: USD.currency, expectedInitialReserve: 2 },
    ])

    await waitForSettlement(buyerBuyOrder.id!, 'buy')

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.2, pair.fee.id)
    await verifySellOrderPresentInDepth({
      orderId: sellerSellOrder.id,
      pair,
      expectedRemaining: 10,
    })
    await verifyBuyOrderPresentInDepth({ orderId: sellerBuyOrder.id, pair, expectedRemaining: 20 })

    await verifyTopOfAskDepthUpdatedEventDispatched(sellerSellOrder.limitPrice!)
    await verifyTopOfBidDepthUpdatedEventDispatched(sellerBuyOrder.limitPrice!)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: KAU.id,
        accountId: sellerSellOrder.accountId,
        amount: new Decimal(sellerSellOrder.amount)
          .times(1 + DEFAULT_TEST_FEE_RATE)
          .toDP(KAU.boundary?.maxDecimals!, Decimal.ROUND_DOWN)
          .toNumber(),
        sourceEventId: sellerSellOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
