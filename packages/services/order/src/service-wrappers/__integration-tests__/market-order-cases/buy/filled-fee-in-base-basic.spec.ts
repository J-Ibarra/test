import {
  placeSellLimitOrder,
  verifyFeeAddedToOperatorAccount,
  KAU,
  USD,
  subscribeToDepthUpdateEvents,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  verifyAvailableBalanceUpdateCall,
  waitForSellOrderToAppearInDepth,
  placeBuyMarketOrder,
  verifySellOrderPresentInDepth,
  verifyTopOfAskDepthUpdatedEventDispatched,
} from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import Decimal from 'decimal.js'
import { expect } from 'chai'
import { SourceEventType } from '@abx-types/balance'

describe('Market Orders: Buy', async () => {
  let pair
  let updateAvailable: sinon.SinonStub
  let reserveBalanceStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, updateAvailableStub, balanceReserveStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
    reserveBalanceStub = balanceReserveStub
  })

  it('Market Order - Filled (Full) - Within Available Balance - BUY (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: sellerId }, { accountId: buyerId }] = await createTestTradingAccounts(4)

    const sellOrder = await placeSellLimitOrder({
      amount: 20,
      limitPrice: 55,
      sellerAccountId: sellerId,
      pair,
    })
    await waitForSellOrderToAppearInDepth({ orderId: sellOrder.id, pair, account: sellerId })

    const buyerBuyOrder = await placeBuyMarketOrder({
      amount: 10,
      buyerAccountId: buyerId,
      pair,
      waitForSettlement: true,
    })

    stubBalanceReserveAdjustmentCalls([
      {
        orderId: buyerBuyOrder.id!,
        accountId: buyerBuyOrder.accountId,
        currencyCode: USD.currency,
        expectedInitialReserve: buyerBuyOrder.amount * sellOrder.limitPrice!,
      },
    ])

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.2, pair.fee.id)
    await verifySellOrderPresentInDepth({ orderId: sellOrder.id, pair, expectedRemaining: 10 })

    await verifyTopOfAskDepthUpdatedEventDispatched(55)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: USD.id,
        accountId: buyerBuyOrder.accountId,
        amount: buyerBuyOrder.amount * sellOrder.limitPrice!,
        sourceEventId: buyerBuyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      buyerBuyOrder.accountId,
      new Decimal(buyerBuyOrder.amount)
        .times(1 - DEFAULT_TEST_FEE_RATE)
        .toDP(KAU.boundary?.maxDecimals)
        .toNumber(),
      KAU.id,
    )
  }).timeout(60_000)
})
