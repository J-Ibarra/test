import {
  cancelOrder,
  placeBuyLimitOrder,
  placeSellLimitOrder,
  ETH,
  USD,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { expect } from 'chai'
import { setUp } from '../../utils/setup.utils'
import { SourceEventType } from '@abx-types/balance'
import Decimal from 'decimal.js'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Limit Orders: Sell', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let releaseReserveStub: sinon.SinonStub
  const customFeeRate = 0.022

  beforeEach(async function() {
    const { symbol, balanceReserveStub, releaseReserve } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: USD,
      feeCurrency: ETH,
      customFeeRate,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    releaseReserveStub = releaseReserve
  })

  it('Limit Order Sell - partially filled - cancelled - fee taken from base - ETH_USD', async function() {
    const [{ accountId: sellerId }, { accountId: buyerId1 }, { accountId: buyerId2 }] = await createTestTradingAccounts(3)

    const sellOrder = await placeSellLimitOrder({ amount: 1.5, limitPrice: 186.45, sellerAccountId: sellerId, pair })

    const buyOrder1 = await placeBuyLimitOrder({ amount: 0.000055, limitPrice: 186.45, buyerAccountId: buyerId1, pair })
    const buyOrder2 = await placeBuyLimitOrder({ amount: 1.4, limitPrice: 186.45, buyerAccountId: buyerId2, pair })

    const expectedInitialReserve = new Decimal(sellOrder.amount)
      .times(1 + customFeeRate)
      .toDP(ETH.boundary!.maxDecimals, Decimal.ROUND_DOWN)
      .toNumber()
    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder1.id!, accountId: buyerId1, currencyCode: USD.currency, expectedInitialReserve },
      { orderId: buyOrder2.id!, accountId: buyerId2, currencyCode: USD.currency, expectedInitialReserve },
      { orderId: sellOrder.id!, accountId: sellerId, currencyCode: ETH.currency, expectedInitialReserve },
    ])

    await waitForSettlement(buyOrder1.id!, 'buy')
    await waitForSettlement(buyOrder2.id!, 'buy')
    await cancelOrder(sellOrder, true)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.base.id,
        accountId: sellOrder.accountId,
        amount: expectedInitialReserve,
        sourceEventId: sellOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    expect(
      releaseReserveStub.calledWith({
        currencyId: pair.base.id,
        accountId: sellOrder.accountId,
        amount: 0.102135,
        sourceEventId: sellOrder.id!,
        sourceEventType: SourceEventType.orderCancellation,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
