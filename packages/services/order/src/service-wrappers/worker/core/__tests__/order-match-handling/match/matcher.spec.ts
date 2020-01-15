import { expect } from 'chai'
import sinon from 'sinon'
import { OrderDirection, OrderStatus } from '@abx-types/order'
import * as depthOperations from '../../../order-match-handling/depth'
import { matchOrder } from '../../../order-match-handling/match/matcher/matcher'
import * as orderFillOperations from '../../../order-match-handling/match/matcher/order_filler'
import { createOrder } from '../test-utils'

describe('matcher', () => {
  beforeEach(() => {
    sinon.restore()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return order if 0 remaining or status is cancel', async () => {
    const orderNoRemaining = createOrder({
      orderId: 2,
      accountId: 'bar',
      symbolId: 'KAU_USD',
      remaining: 0,
      direction: OrderDirection.sell,
    })

    const result = await matchOrder(orderNoRemaining, {} as any, {} as any)
    expect(result.orderMatches).to.eql([])
    expect(result.orderUpdates).to.eql([])

    const orderStatus = createOrder({
      orderId: 2,
      accountId: 'bar',
      symbolId: 'KAU_USD',
      direction: OrderDirection.sell,
      status: OrderStatus.cancel,
    })

    const result2 = await matchOrder(orderStatus, {} as any, {} as any)
    expect(result2.orderMatches).to.eql([])
    expect(result2.orderUpdates).to.eql([])
  })

  it('should get top order from depth and attempt a match', async () => {
    const buyOrder = createOrder({
      orderId: 1,
      accountId: 'bar',
      symbolId: 'KAU_USD',
      direction: OrderDirection.buy,
    })
    const sellOrder = createOrder({
      orderId: 2,
      accountId: 'baz',
      symbolId: 'KAU_USD',
      direction: OrderDirection.sell,
    })

    const getTopOrderStub = sinon
      .stub(depthOperations, 'getTopOrder')
      .onFirstCall()
      .callsFake(() => sellOrder)
    const fillOrdersStub = sinon.stub(orderFillOperations, 'fillOrders').callsFake(() =>
      Promise.resolve({
        ordersFilled: true,
        order: buyOrder,
        orderMatches: [],
        orderUpdates: [],
        cancelOrder: false,
        cancelMatchingOrder: false,
      }),
    )

    await matchOrder(buyOrder, {} as any, {} as any)
    expect(getTopOrderStub.calledWith(buyOrder.symbolId, undefined as any, OrderDirection.sell, buyOrder.accountId)).to.eql(true)
    expect(fillOrdersStub.calledWith(buyOrder, sellOrder, undefined as any, [], [], {} as any)).to.eql(true)
  })
})
