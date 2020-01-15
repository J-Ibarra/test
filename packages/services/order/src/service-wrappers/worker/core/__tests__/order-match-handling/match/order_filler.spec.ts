import { expect } from 'chai'
import sinon from 'sinon'
import * as libOperations from '../../../../../../core'
import * as marketOperations from '@abx-service-clients/market-data'
import { Order, OrderDirection, OrderMatchStatus, OrderStatus } from '@abx-types/order'
import * as depthOperations from '../../../order-match-handling/depth'
import { fillOrders } from '../../../order-match-handling/match/matcher/order_filler'
import { createOrder } from '../test-utils'

const transaction = {} as any
const depth = {
  orders: {
    KAU_USD: {},
  },
} as any

describe('fillOrders', () => {
  beforeEach(() => {
    sinon.restore()
    sinon.stub(libOperations, 'validateBoundaries').resolves()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return ordersFilled = false if matching amount = 0', async () => {
    const order = createOrder({
      orderId: 1,
      accountId: 'foo',
      symbolId: 'KAU_USD',
      direction: OrderDirection.buy,
    })
    const matchingOrder = createOrder({
      orderId: 2,
      accountId: 'bar',
      symbolId: 'KAU_USD',
      remaining: 0,
      direction: OrderDirection.sell,
    })

    const fillResult = await fillOrders(order, matchingOrder, depth, [], [], transaction)
    expect(fillResult.ordersFilled).to.eql(false)
  })

  it('should update orders in db and matchingOrder in depth and use match price when calculating FeeCurrency_USD mid price', async () => {
    const buyOrder = createOrder({
      orderId: 1,
      accountId: 'foo',
      symbolId: 'KAU_USD',
      direction: OrderDirection.buy,
    })
    const matchingOrder = createOrder({
      orderId: 2,
      accountId: 'bar',
      symbolId: 'KAU_USD',
      direction: OrderDirection.sell,
    })

    const orderMatch = createOrderMatch(buyOrder, matchingOrder)

    sinon.stub(libOperations, 'createOrderMatchTransaction').resolves({ get: () => orderMatch })
    const saveOrderStub = sinon.stub(libOperations, 'saveOrder').callsFake(({ order }) => Promise.resolve(order))
    const updateOrderStub = sinon.stub(depthOperations, 'updateOrderInDepth').callsFake(() => true)

    const fillResult = await fillOrders(buyOrder, matchingOrder, depth, [], [], transaction)
    expect(
      saveOrderStub.calledWith({
        order: { ...buyOrder, remaining: 0, status: OrderStatus.fill },
        transaction,
      }),
    ).to.eql(true)
    expect(
      saveOrderStub.calledWith({
        order: { ...matchingOrder, remaining: 0, status: OrderStatus.fill },
        transaction,
      }),
    ).to.eql(true)
    expect(updateOrderStub.calledWith(matchingOrder, depth)).to.eql(true)
    expect(fillResult.orderMatches[0]).to.eql({
      ...orderMatch,
      feeCurrencyToUsdMidPrice: orderMatch.matchPrice,
    })
  })

  it('should update orders in db and matchingOrder in depth and use KAU_USD mid-price', async () => {
    const buyOrder = createOrder({
      orderId: 1,
      accountId: 'foo',
      symbolId: 'KAU_KAG',
      direction: OrderDirection.buy,
    })
    const matchingOrder = createOrder({
      orderId: 2,
      accountId: 'bar',
      symbolId: 'KAU_KAG',
      direction: OrderDirection.sell,
    })

    const orderMatch = createOrderMatch(buyOrder, matchingOrder, 'KAU_KAG')
    const latestKauUsdMidPrice = 10

    sinon.stub(libOperations, 'createOrderMatchTransaction').resolves({ get: () => orderMatch })
    sinon.stub(libOperations, 'saveOrder').callsFake(({ order }) => Promise.resolve(order))
    sinon.stub(depthOperations, 'updateOrderInDepth').resolves(true)
    sinon.stub(marketOperations, 'calculateMidPriceForSymbol').resolves(latestKauUsdMidPrice)

    const fillResult = await fillOrders(buyOrder, matchingOrder, depth, [], [], transaction)

    expect(fillResult.orderMatches[0]).to.eql({
      ...orderMatch,
      feeCurrencyToUsdMidPrice: latestKauUsdMidPrice,
    })
  })
})

const createOrderMatch = (sellOrder: Order, buyOrder: Order, symbolId = 'KAU_USD') => ({
  symbolId,
  amount: 5,
  matchPrice: 12.5,
  consideration: 62.5,
  sellAccountId: sellOrder.accountId,
  sellOrderId: sellOrder.id,
  sellOrderType: sellOrder.orderType,
  buyAccountId: buyOrder.accountId,
  buyOrderId: buyOrder.id,
  buyOrderType: buyOrder.orderType,
  status: OrderMatchStatus.matched,
})
