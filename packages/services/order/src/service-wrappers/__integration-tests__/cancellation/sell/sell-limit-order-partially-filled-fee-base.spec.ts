import {
  cancelOrder,
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  KAU,
  KAG,
  waitForSellOrderToAppearInDepth,
} from '../../utils'
import { expect } from 'chai'
import { setUp } from '../../utils/setup.utils'
import { SourceEventType } from '@abx-types/balance'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Limit Orders: Sell', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let releaseReserveStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, releaseReserve } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: KAG,
      feeCurrency: KAG,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    releaseReserveStub = releaseReserve
  })

  it('Limit Order Sell - partially filled - cancelled - fee taken from base', async function() {
    const [{ accountId: sellerId }, { accountId: buyerId1 }, { accountId: buyerId2 }] = await createTestTradingAccounts(3)

    const sellOrder = await placeSellLimitOrder({ amount: 1.5, limitPrice: 186.45, sellerAccountId: sellerId, pair })

    await waitForSellOrderToAppearInDepth({ orderId: sellOrder.id, pair, account: sellerId })
    const buyOrder1 = await placeBuyLimitOrder({ amount: 0.000055, limitPrice: 186.45, buyerAccountId: buyerId1, pair })
    const buyOrder2 = await placeBuyLimitOrder({ amount: 1.4, limitPrice: 186.45, buyerAccountId: buyerId2, pair })

    stubBalanceReserveAdjustmentCalls([
      { orderId: sellOrder.id!, accountId: sellerId, currencyCode: KAU.currency, expectedInitialReserve: 1.5 },
      { orderId: buyOrder1.id!, accountId: buyerId1, currencyCode: KAG.currency, expectedInitialReserve: 1 },
      { orderId: buyOrder2.id!, accountId: buyerId2, currencyCode: KAG.currency, expectedInitialReserve: 1 },
    ])

    await waitForSettlement(buyOrder1.id!, 'buy')
    await waitForSettlement(buyOrder2.id!, 'buy')
    await cancelOrder(sellOrder, true)

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
