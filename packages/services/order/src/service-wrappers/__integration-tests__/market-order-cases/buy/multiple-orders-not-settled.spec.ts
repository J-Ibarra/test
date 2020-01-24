import {
  placeSellLimitOrder,
  USD,
  createTestTradingAccounts,
  waitForSellOrderToAppearInDepth,
  placeBuyMarketOrder,
  ETH,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { OrderMatchStatus } from '@abx-types/order'
import { expect } from 'chai'
import { last } from 'lodash'
import { waitForSettlement } from '../../utils/settlement_waiter'
import { findOrderMatchTransactions } from '../../../../core'

describe('Market Orders: Buy', async () => {
  let pair

  beforeEach(async function() {
    this.timeout(20_000)
    const { symbol } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: USD,
      feeCurrency: ETH,
    })
    pair = symbol
  })

  // This test replicates an error observed in UAT
  it('Market Order - Place Sell Order, then Buy Through Depth', async () => {
    const [{ accountId: buyerId }, { accountId: seller1Id }] = await createTestTradingAccounts(2)
    const orderAmountsAndPrices = [
      [1, 100],
      [1, 101],
      [1, 102],
      [1, 103],
      [1, 104],
      [1, 105],
      [1, 106],
      [1, 107],
      [1, 108],
      [1, 109],
      [1, 110],
      [1, 111],
      [1, 112],
      [1, 113],
      [1, 114],
    ]
    await placeSellLimitOrder({
      amount: 15,
      limitPrice: 100,
      sellerAccountId: buyerId,
      pair,
    })

    const placedSellOrders = await Promise.all(
      orderAmountsAndPrices.map(([amount, limitPrice]: [number, number]) =>
        placeSellLimitOrder({
          amount,
          limitPrice,
          sellerAccountId: seller1Id,
          pair,
        }),
      ),
    )

    const lastSellOrder = last(await placedSellOrders)
    await waitForSellOrderToAppearInDepth({ orderId: lastSellOrder!.id, pair, account: seller1Id })

    const buyOrder = await placeBuyMarketOrder({
      amount: 50,
      buyerAccountId: buyerId,
      pair,
    })
    stubBalanceReserveAdjustmentCalls([{ orderId: buyOrder.id!, accountId: buyerId, currencyCode: USD.currency, expectedInitialReserve: 1 }])

    await waitForSettlement(buyOrder.id!, 'buy')
    const filledOrders = await findOrderMatchTransactions({})

    expect(filledOrders.length).to.eql(15)
    filledOrders.forEach(order => {
      expect(order.status).to.eql(OrderMatchStatus.settled)
    })
  }).timeout(60_000)
})
