import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  verifyAvailableBalanceUpdateCall,
  KAU,
  ETH,
  verifyBuyOrderPresentInDepth,
} from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'
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
      baseCurrency: ETH,
      quoteCurrency: KAU,
      feeCurrency: KAU,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
    reserveBalanceStub = balanceReserveStub
  })

  it('Limit Order - Filled (Full) - Multiple Order Match - Multiple Depth Levels -  Leave Resting Depth - SELL (fees in quote)', async () => {
    const [{ accountId: buyer1Id }, { accountId: buyer2Id }, { accountId: buyer3Id }, { accountId: sellerId }] = await createTestTradingAccounts(4)

    const buyOrder1 = await placeBuyLimitOrder({ amount: 10, limitPrice: 15, buyerAccountId: buyer1Id, pair })
    const buyOrder2 = await placeBuyLimitOrder({ amount: 10, limitPrice: 10, buyerAccountId: buyer2Id, pair })
    const lastBuyOrder = await placeBuyLimitOrder({
      amount: 10,
      limitPrice: 5,
      buyerAccountId: buyer3Id,
      pair,
    })

    const sellOrder = await placeSellLimitOrder({
      amount: 25,
      limitPrice: 5,
      sellerAccountId: sellerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder1.id!, accountId: buyOrder1.accountId, currencyCode: KAU.currency, expectedInitialReserve: 1 },
      { orderId: buyOrder2.id!, accountId: buyOrder2.accountId, currencyCode: KAU.currency, expectedInitialReserve: 1 },
      { orderId: lastBuyOrder.id!, accountId: lastBuyOrder.accountId, currencyCode: KAU.currency, expectedInitialReserve: 1 },
    ])

    await waitForSettlement(sellOrder.id!, 'sell')

    await verifyFeeAddedToOperatorAccount(updateAvailable, 5.5, pair.fee.id)
    await verifyBuyOrderPresentInDepth({ orderId: lastBuyOrder.id, pair, expectedRemaining: 5 })

    expect(
      reserveBalanceStub.calledWith({
        currencyId: ETH.id,
        accountId: sellOrder.accountId,
        amount: sellOrder.amount,
        sourceEventId: sellOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    const orderMatch1QuoteFee = new Decimal(buyOrder1.amount).times(buyOrder1.limitPrice!).times(DEFAULT_TEST_FEE_RATE)
    const orderMatch2QuoteFee = new Decimal(buyOrder2.amount).times(buyOrder2.limitPrice!).times(DEFAULT_TEST_FEE_RATE)

    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellOrder.accountId,
      new Decimal(buyOrder1.amount)
        .times(buyOrder1.limitPrice!)
        .minus(orderMatch1QuoteFee)
        .toDP(KAU.boundary?.maxDecimals)
        .toNumber(),
      KAU.id,
    )
    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellOrder.accountId,
      new Decimal(buyOrder2.amount)
        .times(buyOrder2.limitPrice!)
        .minus(orderMatch2QuoteFee)
        .toDP(KAU.boundary?.maxDecimals)
        .toNumber(),
      KAU.id,
    )
  }).timeout(60_000)
})
