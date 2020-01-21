import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  verifyFinaliseReserveCall,
  verifyAvailableBalanceUpdateCall,
  KAU,
  subscribeToDepthUpdateEvents,
  ETH,
  verifyBuyOrderPresentInDepth,
  verifyTopOfBidDepthUpdatedEventDispatched,
} from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'
import Decimal from 'decimal.js'
import { expect } from 'chai'
import { SourceEventType } from '@abx-types/balance'

describe('Limit Order::Sell', async () => {
  let pair
  let updateAvailable: sinon.SinonStub
  let finaliseReserve: sinon.SinonStub
  let reserveBalanceStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, updateAvailableStub, finaliseReserveStub, balanceReserveStub } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: KAU,
      feeCurrency: KAU,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
    finaliseReserve = finaliseReserveStub
    reserveBalanceStub = balanceReserveStub
  })

  it('Limit Order - Filled (Full) - Single Order Match - No Reference Price Change - Not Same Traders Order - Price Precedence (Provider) [fee rebate] - SELL (fees in quote)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyerId }, { accountId: sellerId }] = await createTestTradingAccounts(3)

    const buyOrder = await placeBuyLimitOrder({
      amount: 10,
      limitPrice: 20,
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

    const sellOrder = await placeSellLimitOrder({
      amount: 5,
      limitPrice: 15,
      sellerAccountId: sellerId,
      pair,
      waitForSettlement: true,
    })

    await verifyFeeAddedToOperatorAccount(updateAvailable, 2, pair.fee.id)
    await verifyBuyOrderPresentInDepth({ orderId: buyOrder.id, pair, expectedRemaining: 5 })
    await verifyTopOfBidDepthUpdatedEventDispatched(20)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: ETH.id,
        accountId: sellOrder.accountId,
        amount: new Decimal(sellOrder.amount).toDP(KAU.boundary?.maxDecimals).toNumber(),
        sourceEventId: sellOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    verifyFinaliseReserveCall(finaliseReserve, sellOrder.accountId, sellOrder.amount, ETH.id, SourceEventType.orderMatchRelease)

    const tradeQuoteFee = new Decimal(sellOrder.amount).times(buyOrder.limitPrice!).times(DEFAULT_TEST_FEE_RATE)

    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellOrder.accountId,
      new Decimal(sellOrder.amount)
        .times(buyOrder.limitPrice!)
        .minus(tradeQuoteFee)
        .toDP(KAU.boundary?.maxDecimals)
        .toNumber(),
      KAU.id,
    )
  }).timeout(60_000)
})
