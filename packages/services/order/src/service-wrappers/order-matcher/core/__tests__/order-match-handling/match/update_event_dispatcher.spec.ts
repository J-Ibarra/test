import { expect } from 'chai'
import sinon from 'sinon'

import { OrderDirection, OrderMatchStatus, OrderType, UsdMidPriceEnrichedOrderMatch } from '@abx-types/order'
import { broadcastUpdates } from '../../../order-match-handling/match/matcher/update_event_dispatcher'
import { createOrder } from '../test-utils'

describe('order match broadcastUpdates', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('should broadcast order updates and order matches', () => {
    const order1 = createOrder({
      orderId: 1,
      accountId: 'foo',
      symbolId: 'KAU_USD',
      direction: OrderDirection.buy,
    })
    const order2 = createOrder({
      orderId: 2,
      accountId: 'bar',
      symbolId: 'KAU_USD',
      direction: OrderDirection.sell,
    })

    const orderMatch: UsdMidPriceEnrichedOrderMatch = {
      symbolId: 'KAU_USD',
      amount: 10,
      matchPrice: 10,
      consideration: 10,
      sellAccountId: 'bar',
      sellOrderId: order2.id!,
      sellOrderType: OrderType.limit,
      buyAccountId: order1.accountId,
      buyOrderId: order1.id!,
      buyOrderType: OrderType.limit,
      status: OrderMatchStatus.matched,
      feeCurrencyToUsdMidPrice: 12,
    }

    const handler = {
      broadcast: {
        orderUpdated: sinon.stub(),
        orderMatched: sinon.stub(),
      },
    }
    broadcastUpdates([order1, order2], [orderMatch], handler)
    expect(handler.broadcast.orderUpdated.getCalls()[0].args[0]).to.eql(order1)
    expect(handler.broadcast.orderUpdated.getCalls()[1].args[0]).to.eql(order2)
    expect(handler.broadcast.orderMatched.getCalls()[0].args[0]).to.eql(orderMatch)
  })
})
