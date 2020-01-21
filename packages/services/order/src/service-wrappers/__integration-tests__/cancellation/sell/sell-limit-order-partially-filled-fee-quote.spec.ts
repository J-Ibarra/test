import {
  cancelOrder,
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  ETH,
  KAG,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { expect } from 'chai'
import { SourceEventType } from '@abx-types/balance'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Limit Orders: Sell', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let releaseReserveStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, releaseReserve } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: KAG,
      feeCurrency: KAG,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    releaseReserveStub = releaseReserve
  })

  it('Limit Order Sell - partially filled - cancelled - fee taken from quote', async function() {
    const [{ accountId: sellerId }, { accountId: buyerId1 }, { accountId: buyerId2 }, { accountId: buyerId3 }] = await createTestTradingAccounts(4)

    stubBalanceReserveAdjustmentCalls([
      { orderId: 1, accountId: sellerId, currencyCode: ETH.currency, expectedInitialReserve: 65 },
      { orderId: 2, accountId: buyerId1, currencyCode: KAG.currency, expectedInitialReserve: 1 },
      { orderId: 3, accountId: buyerId2, currencyCode: KAG.currency, expectedInitialReserve: 1 },
      { orderId: 4, accountId: buyerId3, currencyCode: KAG.currency, expectedInitialReserve: 1 },
    ])

    const sellOrder = await placeSellLimitOrder({ amount: 65, limitPrice: 36.65432, sellerAccountId: sellerId, pair })

    await placeBuyLimitOrder({ amount: 9.134, limitPrice: 36.65432, buyerAccountId: buyerId1, pair })
    await placeBuyLimitOrder({ amount: 9.2211, limitPrice: 36.65432, buyerAccountId: buyerId2, pair })
    await placeBuyLimitOrder({ amount: 44, limitPrice: 36.65432, buyerAccountId: buyerId3, pair })

    await cancelOrder(sellOrder, true)

    await waitForSettlement(sellOrder.id!, 'sell')

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
        amount: 65 - (9.134 + 9.2211 + 44),
        sourceEventId: sellOrder.id!,
        sourceEventType: SourceEventType.orderCancellation,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
