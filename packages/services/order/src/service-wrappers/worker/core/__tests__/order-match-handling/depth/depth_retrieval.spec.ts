import { expect } from 'chai'
import { head } from 'lodash'
import sinon from 'sinon'

import * as orderOperations from '../../../../../../core'
import { OrderDirection, OrderStatus, OrderType, OrderValidity } from '@abx-types/order'
import * as depthOperations from '../../../order-match-handling/depth/redis'
import { getDepthForSymbol } from '../../../order-match-handling/depth'

const symbolId = 'KAU_USD'

describe('depth_retrieval', () => {
  afterEach(() => sinon.restore())

  it('getDepthForSymbol should retrieve depth from cache when present', async () => {
    const testDepth = {
      [OrderDirection.buy]: [createOrder(OrderDirection.buy), createOrder(OrderDirection.buy)],
      [OrderDirection.sell]: [createOrder(OrderDirection.sell), createOrder(OrderDirection.sell)],
    }

    sinon.stub(depthOperations, 'getDepthFromCache').returns(Promise.resolve(testDepth))

    const depth = await getDepthForSymbol(symbolId, 1)
    expect(depth).to.eql({
      [OrderDirection.buy]: [head(testDepth[OrderDirection.buy])],
      [OrderDirection.sell]: [head(testDepth[OrderDirection.sell])],
    })
  })

  it('getDepthForSymbol should retrieve depth from db when not present in cache', async () => {
    sinon.stub(depthOperations, 'getDepthFromCache').returns(
      Promise.resolve({
        [OrderDirection.buy]: [],
        [OrderDirection.sell]: [],
      }),
    )

    const findOrdersStub = sinon.stub(orderOperations, 'findOrders')

    const buyOrders = [createOrder(OrderDirection.buy)]
    const sellOrders = [createOrder(OrderDirection.sell)]

    findOrdersStub.onFirstCall().returns(Promise.resolve(buyOrders))
    findOrdersStub.onSecondCall().returns(Promise.resolve(sellOrders))

    const depth = await getDepthForSymbol(symbolId, 1)
    expect(depth).to.eql({
      [OrderDirection.buy]: [head(buyOrders)],
      [OrderDirection.sell]: [head(sellOrders)],
    })
  })
})

const createOrder = (direction: OrderDirection) => ({
  accountId: 'acc1',
  symbolId,
  direction,
  amount: 10,
  remaining: 5,
  status: OrderStatus.submit,
  orderType: OrderType.limit,
  validity: OrderValidity.GTD,
  limitPrice: 10,
})
