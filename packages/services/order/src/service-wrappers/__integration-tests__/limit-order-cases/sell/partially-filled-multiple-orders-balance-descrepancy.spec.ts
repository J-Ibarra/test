import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
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
import { waitForSettlement } from '../../utils/settlement_waiter'

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

  it('Limit Order - Filled (Full) - Multiple Order Match - Multiple Depth Levels -  Run Through All Depth - SELL (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: sellerId }, { accountId: buyer1Id }, { accountId: buyer2Id }, { accountId: buyer3Id }] = await createTestTradingAccounts(4)

    const buyOrder1 = await placeBuyLimitOrder({ amount: 10, limitPrice: 15, buyerAccountId: buyer1Id, pair })
    const buyOrder2 = await placeBuyLimitOrder({ amount: 10, limitPrice: 10, buyerAccountId: buyer2Id, pair })
    const buyOrder3 = await placeBuyLimitOrder({ amount: 10, limitPrice: 5, buyerAccountId: buyer3Id, pair })

    const sellOrder = await placeSellLimitOrder({
      amount: 30,
      limitPrice: 5,
      sellerAccountId: sellerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder1.id!, accountId: buyOrder1.accountId, currencyCode: USD.currency, expectedInitialReserve: 1 },
      { orderId: buyOrder2.id!, accountId: buyOrder2.accountId, currencyCode: USD.currency, expectedInitialReserve: 2 },
      { orderId: buyOrder3.id!, accountId: buyOrder3.accountId, currencyCode: USD.currency, expectedInitialReserve: 3 },
    ])

    await waitForSettlement(sellOrder.id!, 'sell')

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.6, pair.fee.id)
    await verifyTopOfBidDepthUpdatedEventDispatched(15)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: KAU.id,
        accountId: sellOrder.accountId,
        amount: new Decimal(sellOrder.amount)
          .times(1 + DEFAULT_TEST_FEE_RATE)
          .toDP(KAU.boundary?.maxDecimals!, Decimal.ROUND_DOWN)
          .toNumber(),
        sourceEventId: sellOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellOrder.accountId,
      new Decimal(buyOrder1.amount)
        .times(buyOrder1.limitPrice!)
        .toDP(USD.boundary?.maxDecimals)
        .toNumber(),
      USD.id,
    )

    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellOrder.accountId,
      new Decimal(buyOrder2.amount)
        .times(buyOrder2.limitPrice!)
        .toDP(USD.boundary?.maxDecimals)
        .toNumber(),
      USD.id,
    )
  }).timeout(60_000)
})
