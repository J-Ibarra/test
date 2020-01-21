import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  ETH,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  KAU,
  verifyFeeAddedToOperatorAccount,
  verifySellOrderPresentInDepth,
  verifyTopOfAskDepthUpdatedEventDispatched,
  verifyTopOfBidDepthUpdatedEventDispatched,
  verifyAvailableBalanceUpdateCall,
  subscribeToDepthUpdateEvents,
} from '../../utils'
import { expect } from 'chai'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import { SourceEventType } from '@abx-types/balance'
import Decimal from 'decimal.js'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Limit Orders: Sell', async () => {
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

  it('Limit Order - Partial Fill - Fill to Below Limit - SELL (fees in quote)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: sellerId }, { accountId: buyerId1 }, { accountId: buyerId2 }, { accountId: buyerId3 }] = await createTestTradingAccounts(4)

    const buyOrder1 = await placeBuyLimitOrder({ amount: 10, limitPrice: 15, buyerAccountId: buyerId1, pair })
    const buyOrder2 = await placeBuyLimitOrder({ amount: 10, limitPrice: 10, buyerAccountId: buyerId2, pair })
    const buyOrder3 = await placeBuyLimitOrder({ amount: 10, limitPrice: 5, buyerAccountId: buyerId3, pair })

    const sellOrder = await placeSellLimitOrder({
      amount: 30,
      limitPrice: 8,
      sellerAccountId: sellerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder1.id!, accountId: buyOrder1.accountId, currencyCode: KAU.currency, expectedInitialReserve: 1 },
      { orderId: buyOrder2.id!, accountId: buyOrder2.accountId, currencyCode: KAU.currency, expectedInitialReserve: 2 },
      { orderId: buyOrder3.id!, accountId: buyOrder3.accountId, currencyCode: KAU.currency, expectedInitialReserve: 3 },
    ])

    await waitForSettlement(sellOrder.id!, 'sell')

    await verifyFeeAddedToOperatorAccount(updateAvailable, 5, pair.fee.id)
    await verifySellOrderPresentInDepth({ orderId: sellOrder.id, pair, expectedRemaining: 10 })

    await verifyTopOfAskDepthUpdatedEventDispatched(8)
    await verifyTopOfBidDepthUpdatedEventDispatched(15)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: ETH.id,
        accountId: sellOrder.accountId,
        amount: sellOrder.amount,
        sourceEventId: sellOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellOrder.accountId,
      new Decimal(buyOrder1.amount)
        .times(buyOrder1.limitPrice!)
        .times(1 + DEFAULT_TEST_FEE_RATE)
        .toDP(KAU.boundary?.maxDecimals)
        .toNumber(),
      KAU.id,
    )
  }).timeout(60_000)
})
