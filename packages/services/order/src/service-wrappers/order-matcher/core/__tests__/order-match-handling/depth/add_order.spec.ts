import { expect } from 'chai'
import sinon from 'sinon'
import { OrderDirection } from '@abx-types/order'
import { addOrderToDepth } from '../../../order-match-handling/depth'
import { createTestDepth, createOrder } from '../../../../../../core/__tests__/utils'

const symbolId = 'KAU_USD'

describe('add_order', () => {
  let depthUpdatedHandler

  beforeEach(() => {
    depthUpdatedHandler = sinon.mock()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('addOrderToDepth should handle no depth scenario inserting order at the top of the depth', () => {
    const depth = createTestDepth(symbolId, depthUpdatedHandler)

    const order = createOrder({ symbolId, limitPrice: 10, direction: OrderDirection.buy })

    addOrderToDepth(order, depth)

    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.buy, depth.orders[symbolId], true)).to.eql(true)
  })

  it('addOrderToDepth should insert sell order at top of ask depth if order price < top of depth limit price', () => {
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [], [createOrder({ symbolId, limitPrice: 11, direction: OrderDirection.sell })])

    const order = createOrder({ symbolId, limitPrice: 10, direction: OrderDirection.sell })

    addOrderToDepth(order, depth)

    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.sell, depth.orders[symbolId], true)).to.eql(true)
    expect(depth.orders[symbolId][OrderDirection.sell][0]).to.eql(order)
  })

  it('addOrderToDepth should insert sell order at the bottom of the depth if resting orders have the same limitPrice', () => {
    const depth = createTestDepth(
      symbolId,
      depthUpdatedHandler,
      [],
      [
        createOrder({ symbolId, limitPrice: 11, direction: OrderDirection.sell }),
        createOrder({ symbolId, limitPrice: 11, direction: OrderDirection.sell }),
      ],
    )

    const order = createOrder({ symbolId, limitPrice: 11, direction: OrderDirection.sell })

    addOrderToDepth(order, depth)

    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.sell, depth.orders[symbolId], false)).to.eql(true)
    expect(depth.orders[symbolId][OrderDirection.sell][2]).to.eql(order)
  })

  it('addOrderToDepth should insert sell order in the accurate place of the ask depth based on limit ', () => {
    const depth = createTestDepth(
      symbolId,
      depthUpdatedHandler,
      [],
      [
        createOrder({ symbolId, limitPrice: 11, direction: OrderDirection.sell }),
        createOrder({ symbolId, limitPrice: 12, direction: OrderDirection.sell }),
      ],
    )

    const order = createOrder({ symbolId, limitPrice: 11.5, direction: OrderDirection.sell })

    addOrderToDepth(order, depth)

    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.sell, depth.orders[symbolId], false)).to.eql(true)
    expect(depth.orders[symbolId][OrderDirection.sell][1]).to.eql(order)
  })

  it('addOrderToDepth should insert sell order at the tail of the ask depth if limitPrice > all depth limit prices ', () => {
    const depth = createTestDepth(
      symbolId,
      depthUpdatedHandler,
      [],
      [
        createOrder({ symbolId, limitPrice: 11, direction: OrderDirection.sell }),
        createOrder({ symbolId, limitPrice: 12, direction: OrderDirection.sell }),
      ],
    )

    const order = createOrder({ symbolId, limitPrice: 13, direction: OrderDirection.sell })

    addOrderToDepth(order, depth)

    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.sell, depth.orders[symbolId], false)).to.eql(true)
    expect(depth.orders[symbolId][OrderDirection.sell][2]).to.eql(order)
  })

  it('addOrderToDepth should insert buy order at top of bid depth if order price > top of depth limit price', () => {
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [createOrder({ symbolId, limitPrice: 11, direction: OrderDirection.buy })])

    const order = createOrder({ symbolId, limitPrice: 12, direction: OrderDirection.buy })

    addOrderToDepth(order, depth)

    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.buy, depth.orders[symbolId], true)).to.eql(true)
    expect(depth.orders[symbolId][OrderDirection.buy][0]).to.eql(order)
  })

  it('addOrderToDepth should insert buy order in the accurate place of the bid depth based on limit ', () => {
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [
      createOrder({ symbolId, limitPrice: 12, direction: OrderDirection.buy }),
      createOrder({ symbolId, limitPrice: 11, direction: OrderDirection.buy }),
    ])

    const order = createOrder({ symbolId, limitPrice: 11.5, direction: OrderDirection.buy })

    addOrderToDepth(order, depth)

    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.buy, depth.orders[symbolId], false)).to.eql(true)
    expect(depth.orders[symbolId][OrderDirection.buy][1]).to.eql(order)
  })

  it('addOrderToDepth should insert new order at the bottom of the depth if resting orders have the same limitPrice ', () => {
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [
      createOrder({ symbolId, limitPrice: 12, direction: OrderDirection.buy }),
      createOrder({ symbolId, limitPrice: 12, direction: OrderDirection.buy }),
    ])

    const order = createOrder({ symbolId, limitPrice: 12, direction: OrderDirection.buy })

    addOrderToDepth(order, depth)

    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.buy, depth.orders[symbolId], false)).to.eql(true)
    expect(depth.orders[symbolId][OrderDirection.buy][2]).to.eql(order)
  })

  it('addOrderToDepth should insert buy order at the tail of the bid depth if limitPrice > all depth limit prices ', () => {
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [
      createOrder({ symbolId, limitPrice: 12, direction: OrderDirection.buy }),
      createOrder({ symbolId, limitPrice: 11, direction: OrderDirection.buy }),
    ])

    const order = createOrder({ symbolId, limitPrice: 10, direction: OrderDirection.buy })

    addOrderToDepth(order, depth)

    expect(depthUpdatedHandler.calledWith(symbolId, OrderDirection.buy, depth.orders[symbolId], false)).to.eql(true)
    expect(depth.orders[symbolId][OrderDirection.buy][2]).to.eql(order)
  })
})
