import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  KAU,
  subscribeToDepthUpdateEvents,
  ETH,
  verifyBuyOrderPresentInDepth,
  verifyTopOfAskDepthUpdatedEventDispatched,
  verifyTopOfBidDepthUpdatedEventDispatched,
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
      baseCurrency: ETH,
      quoteCurrency: KAU,
      feeCurrency: KAU,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
  })

  it('Limit Order - Partial Fill - Fill to Limit - BUY (fees in quote)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyerId }, { accountId: seller1Id }, { accountId: seller2Id }, { accountId: seller3Id }] = await createTestTradingAccounts(4)

    await placeSellLimitOrder({ amount: 10, limitPrice: 20, sellerAccountId: seller1Id, pair })
    await placeSellLimitOrder({ amount: 10, limitPrice: 25, sellerAccountId: seller2Id, pair })
    await placeSellLimitOrder({ amount: 10, limitPrice: 30, sellerAccountId: seller3Id, pair })

    const buyOrder = await placeBuyLimitOrder({
      amount: 30,
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
    await verifyFeeAddedToOperatorAccount(updateAvailable, 9, pair.fee.id)
    await verifyBuyOrderPresentInDepth({ orderId: buyOrder.id, pair, expectedRemaining: 10 })

    await verifyTopOfAskDepthUpdatedEventDispatched(30)
    await verifyTopOfBidDepthUpdatedEventDispatched(25)
  }).timeout(60_000)
})
