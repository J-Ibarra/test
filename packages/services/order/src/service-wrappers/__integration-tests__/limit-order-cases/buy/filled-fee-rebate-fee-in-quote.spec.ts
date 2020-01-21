import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  ETH,
  stubBalanceReserveAdjustmentCalls,
  subscribeToDepthUpdateEvents,
  verifyTopOfAskDepthUpdatedEventDispatched,
  KAU,
  verifySellOrderPresentInDepth,
} from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import Decimal from 'decimal.js'
import { expect } from 'chai'
import { waitForSettlement } from '../../utils/settlement_waiter'
import { SourceEventType } from '@abx-types/balance'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'

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

  it('Limit Order - Filled (Full) - Single Order Match - No Reference Price Change - Not Same Traders Order - Price Precedence (Provider) [fee rebate] - BUY (fees in quote)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyerId }, { accountId: sellerId }] = await createTestTradingAccounts(4)

    const sellOrder = await placeSellLimitOrder({
      amount: 20,
      limitPrice: 30,
      sellerAccountId: sellerId,
      pair,
    })
    await verifySellOrderPresentInDepth({ orderId: sellOrder.id, pair, expectedRemaining: 20 })

    const buyOrder = await placeBuyLimitOrder({
      amount: 10,
      limitPrice: 35,
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
    await verifyFeeAddedToOperatorAccount(updateAvailable, 6, KAU.id)
    await verifySellOrderPresentInDepth({ orderId: sellOrder.id, pair, expectedRemaining: 10 })
    await verifyTopOfAskDepthUpdatedEventDispatched(30)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: KAU.id,
        accountId: buyOrder.accountId,
        amount: expectedInitialReserve,
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
