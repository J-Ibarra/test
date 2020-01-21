import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  verifyBuyOrderPresentInDepth,
  verifyFeeAddedToOperatorAccount,
  KAU,
  USD,
  subscribeToDepthUpdateEvents,
  createTestTradingAccounts,
  verifyTopOfBidDepthUpdatedEventDispatched,
  stubBalanceReserveAdjustmentCalls,
  verifyAvailableBalanceUpdateCall,
} from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
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

  it('Limit Order - Filled (Full) - Single Order Match - Reference Price Change - SELL (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyer1Id }, { accountId: buyer2Id }, { accountId: sellerId }] = await createTestTradingAccounts(3)

    const buyOrder1 = await placeBuyLimitOrder({ amount: 20, limitPrice: 45, buyerAccountId: buyer1Id, pair })
    const buyOrder2 = await placeBuyLimitOrder({
      amount: 10,
      limitPrice: 40,
      buyerAccountId: buyer2Id,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([
      {
        orderId: buyOrder1.id!,
        accountId: buyOrder1.accountId,
        currencyCode: USD.currency,
        expectedInitialReserve: new Decimal(buyOrder1.amount)
          .times(buyOrder1.limitPrice!)
          .toDP(USD.boundary!.maxDecimals, Decimal.ROUND_DOWN)
          .toNumber(),
      },
      {
        orderId: buyOrder2.id!,
        accountId: buyOrder2.accountId,
        currencyCode: USD.currency,
        expectedInitialReserve: new Decimal(buyOrder2.amount)
          .times(buyOrder2.limitPrice!)
          .toDP(USD.boundary!.maxDecimals, Decimal.ROUND_DOWN)
          .toNumber(),
      },
    ])

    const sellOrder = await placeSellLimitOrder({
      amount: 20,
      limitPrice: 20,
      sellerAccountId: sellerId,
      pair,
      waitForSettlement: true,
    })

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.4, pair.fee.id)
    await verifyBuyOrderPresentInDepth({ orderId: buyOrder2.id, pair, expectedRemaining: 10 })
    await verifyTopOfBidDepthUpdatedEventDispatched(45)

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
        .times(buyOrder1.limitPrice!)
        .toDP(USD.boundary?.maxDecimals)
        .toNumber(),
      USD.id,
    )
  }).timeout(60_000)
})
