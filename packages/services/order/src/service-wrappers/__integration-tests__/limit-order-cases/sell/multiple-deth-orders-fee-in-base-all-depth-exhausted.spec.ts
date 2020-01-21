import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  verifyAvailableBalanceUpdateCall,
  KAU,
  subscribeToDepthUpdateEvents,
  USD,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'
import Decimal from 'decimal.js'

describe('Limit Order::Sell', async () => {
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

  it('Limit Order - Filled (Full) - Multiple Order Match - Multiple Depth Levels -  Run Through All Depth - SELL (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyer1Id }, { accountId: buyer2Id }, { accountId: buyer3Id }, { accountId: sellerId }] = await createTestTradingAccounts(4)

    const buyOrder1 = await placeBuyLimitOrder({ amount: 10, limitPrice: 15, buyerAccountId: buyer1Id, pair })
    const buyOrder2 = await placeBuyLimitOrder({ amount: 10, limitPrice: 10, buyerAccountId: buyer2Id, pair })
    const buyOrder3 = await placeBuyLimitOrder({ amount: 10, limitPrice: 5, buyerAccountId: buyer3Id, pair })

    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder1.id!, accountId: buyOrder1.accountId, currencyCode: USD.currency, expectedInitialReserve: 1 },
      { orderId: buyOrder2.id!, accountId: buyOrder2.accountId, currencyCode: USD.currency, expectedInitialReserve: 1 },
      { orderId: buyOrder3.id!, accountId: buyOrder3.accountId, currencyCode: USD.currency, expectedInitialReserve: 1 },
    ])

    const sellOrder = await placeSellLimitOrder({
      amount: 30,
      limitPrice: 5,
      sellerAccountId: sellerId,
      pair,
      waitForSettlement: true,
    })

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.6, pair.fee.id)

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
