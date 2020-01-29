import { expect } from 'chai'
import { getCacheClient } from '@abx-utils/db-connection-utils'
import { OrderDirection, OrderStatus, OrderType, OrderValidity } from '@abx-types/order'
import { expireOrders } from '..'
import sinon from 'sinon'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { OrderCancellationGateway } from '../order_cancellation_gateway'

function makeOrder(overrideProps) {
  return {
    id: 1,
    userId: 'user1',
    symbolId: 'KAU_USD',
    direction: OrderDirection.buy,
    quantity: 1,
    remaining: 1,
    status: OrderStatus.partialFill,
    orderType: OrderType.limit,
    validity: OrderValidity.GTD,
    expiryDate: new Date(Date.now() - 2000),
    limitPrice: 2.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrideProps,
  }
}

describe('Order Expiry module', () => {
  beforeEach(async () => {
    const mockDepthSymbol1 = {
      [OrderDirection.buy]: [
        makeOrder({ id: 13, orderType: OrderType.limit, expiryDate: new Date(Date.now() - 2000) }),
        makeOrder({ id: 1, expiryDate: new Date(Date.now() - 2000) }),
      ],
      [OrderDirection.sell]: [
        makeOrder({ id: 2, expiryDate: new Date(Date.now() + 7000) }),
        makeOrder({ id: 3, expiryDate: new Date(Date.now() - 1000) }),
      ],
    }
    const mockDepthSymbol4 = {
      [OrderDirection.buy]: [makeOrder({ id: 4, expiryDate: new Date(Date.now() - 2000) })],
      [OrderDirection.sell]: [
        makeOrder({ id: 5, expiryDate: new Date(Date.now() + 7000) }),
        makeOrder({ id: 6, expiryDate: new Date(Date.now() - 1000) }),
      ],
    }

    await getCacheClient().set('exchange:symbol:depth:KAU_USD', mockDepthSymbol1)
    await getCacheClient().set('exchange:symbol:depth:KAG_USD', mockDepthSymbol4)
  })

  afterEach(() => sinon.restore())

  it('calls the expire function on the expired orders', async () => {
    const expiredOrders: number[] = []
    const expectedExpiredOrders = [13, 1, 3, 4, 6]

    sinon.stub(referenceDataOperations, 'getAllSymbolPairSummaries').resolves([
      {
        id: 'KAU_USD',
      },
      {
        id: 'KAG_USD',
      },
    ])
    const cancelOrderStub = sinon.stub(OrderCancellationGateway.prototype, 'cancelOrder').resolves()

    await expireOrders()

    expectedExpiredOrders.forEach(orderId => expect(cancelOrderStub.calledWith({ cancellationReason: 'Order Expired', orderId })).to.eql(true))
    expect(expiredOrders).to.eql(expectedExpiredOrders)
  })
})
