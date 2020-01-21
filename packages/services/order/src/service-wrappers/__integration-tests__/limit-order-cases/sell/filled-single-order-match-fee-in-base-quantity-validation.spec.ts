import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  verifyAvailableBalanceUpdateCall,
  KAU,
  subscribeToDepthUpdateEvents,
  verifyBuyOrderPresentInDepth,
  USD,
} from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'
import Decimal from 'decimal.js'
import { expect } from 'chai'
import { SourceEventType } from '@abx-types/balance'

describe('Limit Order::Sell', async () => {
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

  it('Limit Order - Filled (Full) - Single Order Match - No Reference Price Change - Not Same Traders Order - Price Match (quantity D.P. validation) - SELL (fees in base)', async () => {
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
      .toDP(KAU.boundary!.maxDecimals, Decimal.ROUND_DOWN)
      .toNumber()
    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder.id!, accountId: buyerId, currencyCode: KAU.currency, expectedInitialReserve: expectedInitialReserve },
    ])

    const sellOrder = await placeSellLimitOrder({
      amount: 5,
      sellerAccountId: sellerId,
      limitPrice: 20,
      pair,
      waitForSettlement: true,
    })

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.1, pair.fee.id)
    await verifyBuyOrderPresentInDepth({ orderId: buyOrder.id, pair, expectedRemaining: 5 })

    expect(
      reserveBalanceStub.calledWith({
        currencyId: KAU.id,
        accountId: sellOrder.accountId,
        amount: new Decimal(sellOrder.amount)
          .times(1 + DEFAULT_TEST_FEE_RATE)
          .toDP(KAU.boundary?.maxDecimals)
          .toNumber(),
        sourceEventId: sellOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellOrder.accountId,
      new Decimal(sellOrder.amount)
        .times(buyOrder.limitPrice!)
        .toDP(USD.boundary?.maxDecimals)
        .toNumber(),
      USD.id,
    )
  }).timeout(60_000)
})
