import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  verifyAvailableBalanceUpdateCall,
  KAU,
  verifyBuyOrderPresentInDepth,
  USD,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'
import Decimal from 'decimal.js'
import { waitForSettlement } from '../../utils/settlement_waiter'

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

  it('Limit Order - Filled (Full) - Multiple Order Match - Multiple Depth Levels  - SELL (fees in base)', async () => {
    const [{ accountId: buyer1Id }, { accountId: buyer2Id }, { accountId: sellerId }] = await createTestTradingAccounts(4)

    const firstBuyOrder = await placeBuyLimitOrder({ amount: 10, limitPrice: 20, buyerAccountId: buyer1Id, pair })
    const secondBuyOrder = await placeBuyLimitOrder({
      amount: 10,
      limitPrice: 15,
      buyerAccountId: buyer2Id,
      pair,
    })

    const sellOrder = await placeSellLimitOrder({
      amount: 15,
      limitPrice: 15,
      sellerAccountId: sellerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([
      { orderId: firstBuyOrder.id!, accountId: firstBuyOrder.accountId, currencyCode: USD.currency, expectedInitialReserve: 1 },
      { orderId: secondBuyOrder.id!, accountId: secondBuyOrder.accountId, currencyCode: USD.currency, expectedInitialReserve: 1 },
    ])

    await waitForSettlement(sellOrder.id!, 'sell')

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.3, pair.fee.id)
    await verifyBuyOrderPresentInDepth({ orderId: secondBuyOrder.id, pair, expectedRemaining: 5 })

    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellOrder.accountId,
      new Decimal(firstBuyOrder.amount)
        .times(firstBuyOrder.limitPrice!)
        .toDP(USD.boundary?.maxDecimals)
        .toNumber(),
      USD.id,
    )
    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellOrder.accountId,
      new Decimal(5)
        .times(secondBuyOrder.limitPrice!)
        .toDP(USD.boundary?.maxDecimals)
        .toNumber(),
      USD.id,
    )
  }).timeout(60_000)
})
