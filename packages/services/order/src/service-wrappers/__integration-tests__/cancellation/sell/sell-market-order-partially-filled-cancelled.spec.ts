import {
  placeBuyLimitOrder,
  placeSellMarketOrder,
  waitForBuyOrderToAppearInDepth,
  KAU,
  ETH,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { expect } from 'chai'
import { waitForSettlement } from '../../utils/settlement_waiter'
import { OrderDirection } from '@abx-types/order'
import { SourceEventType } from '@abx-types/balance'

describe('Market Orders: Sell', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let releaseReserveStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, releaseReserve } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: KAU,
      feeCurrency: KAU,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    releaseReserveStub = releaseReserve
  })

  it('Market Order Sell - partially filled - cancelled - fee taken from quote - ETH_KAU', async function() {
    const [{ accountId: buyerId1 }, { accountId: buyerId2 }, { accountId: sellerId }] = await createTestTradingAccounts(3)

    stubBalanceReserveAdjustmentCalls([
      { orderId: 1, accountId: buyerId1, currencyCode: KAU.currency, expectedInitialReserve: 1 },
      { orderId: 2, accountId: buyerId2, currencyCode: KAU.currency, expectedInitialReserve: 1 },
      { orderId: 3, accountId: sellerId, currencyCode: ETH.currency, expectedInitialReserve: 1.5 },
    ])

    const firstBuyOrder = await placeBuyLimitOrder({ amount: 0.000055, limitPrice: 186.45, buyerAccountId: buyerId1, pair })
    const secondBuyOrder = await placeBuyLimitOrder({ amount: 1.4, limitPrice: 186.45, buyerAccountId: buyerId2, pair })

    await waitForBuyOrderToAppearInDepth({ orderId: firstBuyOrder.id, pair, account: buyerId1 })
    await waitForBuyOrderToAppearInDepth({ orderId: secondBuyOrder.id, pair, account: buyerId2 })
    const sellOrder = await placeSellMarketOrder({ amount: 1.5, sellerAccountId: sellerId, pair, waitForCancellation: true })

    await waitForSettlement(firstBuyOrder.id!, OrderDirection.buy)
    await waitForSettlement(secondBuyOrder.id!, OrderDirection.buy)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.base.id,
        accountId: sellOrder.accountId,
        amount: sellOrder.amount,
        sourceEventId: sellOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    expect(
      releaseReserveStub.calledWith({
        currencyId: pair.base.id,
        accountId: sellOrder.accountId,
        amount: 0.099945,
        sourceEventId: sellOrder.id!,
        sourceEventType: SourceEventType.orderCancellation,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
