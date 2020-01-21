import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  KAU,
  subscribeToDepthUpdateEvents,
  USD,
  verifySellOrderPresentInDepth,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'
import Decimal from 'decimal.js'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Limit Orders: Buy', async () => {
  let pair
  let updateAvailable: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, updateAvailableStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
  })

  it('Limit Order - Filled (Full) - Multiple Order Match - Same Depth Level (Multiple Orders) - BUY (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyerId }, { accountId: seller1Id }, { accountId: seller2Id }] = await createTestTradingAccounts(3)

    await placeSellLimitOrder({ amount: 10, limitPrice: 25, sellerAccountId: seller1Id, pair })
    const seller2Order = await placeSellLimitOrder({
      amount: 10,
      limitPrice: 25,
      sellerAccountId: seller2Id,
      pair,
    })

    const buyOrder = await placeBuyLimitOrder({
      amount: 15,
      limitPrice: 25,
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

    await waitForSettlement(buyOrder.id!, 'buy')

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.3, pair.fee.id)
    await verifySellOrderPresentInDepth({ orderId: seller2Order.id, pair, expectedRemaining: 5 })
  }).timeout(60_000)
})
