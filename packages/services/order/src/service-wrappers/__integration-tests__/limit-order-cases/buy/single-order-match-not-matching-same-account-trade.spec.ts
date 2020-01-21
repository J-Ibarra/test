import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  KAU,
  subscribeToDepthUpdateEvents,
  verifyBuyOrderPresentInDepth,
  verifyTopOfAskDepthUpdatedEventDispatched,
  verifyTopOfBidDepthUpdatedEventDispatched,
  USD,
  verifySellOrderPresentInDepth,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'
import { waitForSettlement } from '../../utils/settlement_waiter'
import Decimal from 'decimal.js'

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

  it('Limit Order - Filled (Full) - Single Order Match  - Hit Own Order - BUY (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyerId }, { accountId: sellerId }] = await createTestTradingAccounts(2)

    const buyerSellOrder = await placeSellLimitOrder({
      amount: 20,
      limitPrice: 25,
      sellerAccountId: buyerId,
      pair,
    })
    const sellerOrder = await placeSellLimitOrder({
      amount: 20,
      limitPrice: 30,
      sellerAccountId: sellerId,
      pair,
    })

    const buyOrder = await placeBuyLimitOrder({
      amount: 30,
      limitPrice: 30,
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

    await waitForSettlement(sellerOrder.id!, 'sell')

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.4, pair.fee.id)
    await verifyBuyOrderPresentInDepth({ orderId: buyOrder.id, pair, expectedRemaining: 10 })
    await verifySellOrderPresentInDepth({ orderId: buyerSellOrder.id, pair, expectedRemaining: 20 })

    await verifyTopOfAskDepthUpdatedEventDispatched(30)
    await verifyTopOfBidDepthUpdatedEventDispatched(30)
  }).timeout(60_000)
})
