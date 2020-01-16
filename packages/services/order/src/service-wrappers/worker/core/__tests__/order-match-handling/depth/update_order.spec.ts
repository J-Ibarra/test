import { expect } from 'chai'
import sinon from 'sinon'

import { OrderDirection } from '@abx-types/order'
import * as removeOrderOperations from '../../../order-match-handling/depth/remove_order'
import { createTestDepth, createOrder } from '../../../../../../core/__tests__/utils'
import { updateOrderInDepth } from '../../../order-match-handling/depth'

const symbolId = 'KAU_USD'

describe('update_order', () => {
  let removeOrderFromDepthStub
  let depthUpdatedHandler

  beforeEach(() => {
    sinon.restore()
    depthUpdatedHandler = sinon.mock()
    removeOrderFromDepthStub = sinon.stub(removeOrderOperations, 'removeOrderFromDepth').returns({ orderRemoved: true, topOfDepthUpdated: true })
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should call removeOrderFromDepth when order remaining = 0', () => {
    const order = createOrder({ symbolId, limitPrice: 10, direction: OrderDirection.buy, remaining: 0 })
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [order])

    updateOrderInDepth(order, depth)

    expect(removeOrderFromDepthStub.calledWith(order, depth)).to.eql(true)
  })

  it('should find depth order and update remaining, order at top of bid depth', () => {
    const order = createOrder({ symbolId, limitPrice: 10, direction: OrderDirection.buy, remaining: 5 })
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [{ ...order, remaining: 10 }])

    updateOrderInDepth(order, depth)

    expect(depth.orders[symbolId][OrderDirection.buy][0].remaining).to.eql(5)
    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.buy, depth.orders[order.symbolId], true)).to.eql(true)
  })

  it('should find depth order and update remaining , order not at top of bid depth', () => {
    const order = createOrder({ symbolId, limitPrice: 10, direction: OrderDirection.buy, remaining: 5 })
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [
      createOrder({ id: 2, symbolId, limitPrice: 10, direction: OrderDirection.buy, remaining: 5 }),
      { ...order, remaining: 10 },
    ])

    updateOrderInDepth(order, depth)

    expect(depth.orders[symbolId][OrderDirection.buy][1].remaining).to.eql(5)
    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.buy, depth.orders[order.symbolId], false)).to.eql(true)
  })
})
