import { expect } from 'chai'
import sinon from 'sinon'
import { OrderDirection } from '@abx-types/order'
import { createOrder, createTestDepth } from '../../utils'
import { removeOrderFromDepth } from '../../../order-match-handling/depth'

const symbolId = 'KAU_USD'

describe('remove_order', () => {
  let depthUpdatedHandler

  beforeEach(() => {
    depthUpdatedHandler = sinon.mock()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return true when order removed from top of bid depth', () => {
    const order = createOrder({ symbolId, limitPrice: 10, direction: OrderDirection.buy })
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [order])

    const orderRemovedFromTopOfDepth = removeOrderFromDepth(order, depth).topOfDepthUpdated
    expect(orderRemovedFromTopOfDepth).to.eql(true)
    expect(depth.orders[symbolId][OrderDirection.buy]).to.eql([])
  })

  it('should return true when order removed not the top of bid depth', () => {
    const order = createOrder({ symbolId, limitPrice: 10, direction: OrderDirection.buy })
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [
      createOrder({ id: 2, symbolId, limitPrice: 11, direction: OrderDirection.buy }),
      order,
    ])

    const orderRemovedFromTopOfDepth = removeOrderFromDepth(order, depth).topOfDepthUpdated
    expect(orderRemovedFromTopOfDepth).to.eql(false)
    expect(depth.orders[symbolId][OrderDirection.buy].length).to.eql(1)
  })

  it('should return true when order removed from ask depth', () => {
    const order = createOrder({ symbolId, limitPrice: 10, direction: OrderDirection.sell })
    const depth = createTestDepth(symbolId, depthUpdatedHandler, [], [order])

    const orderRemovedFromTopOfDepth = removeOrderFromDepth(order, depth).topOfDepthUpdated
    expect(orderRemovedFromTopOfDepth).to.eql(true)
    expect(depth.orders[symbolId][OrderDirection.sell]).to.eql([])
  })

  it('should return false when order removed not the top of ask depth', () => {
    const order = createOrder({ symbolId, limitPrice: 10, direction: OrderDirection.sell })
    const depth = createTestDepth(
      symbolId,
      depthUpdatedHandler,
      [],
      [createOrder({ id: 2, symbolId, limitPrice: 11, direction: OrderDirection.sell }), order],
    )

    const orderRemovedFromTopOfDepth = removeOrderFromDepth(order, depth).topOfDepthUpdated
    expect(orderRemovedFromTopOfDepth).to.eql(false)
    expect(depth.orders[symbolId][OrderDirection.sell].length).to.eql(1)
  })
})
