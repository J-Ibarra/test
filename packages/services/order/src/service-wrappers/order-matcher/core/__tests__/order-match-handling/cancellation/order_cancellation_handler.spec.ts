import { expect } from 'chai'
import sinon from 'sinon'
import * as accountOperations from '@abx-service-clients/account'
import { AccountStatus } from '@abx-types/account'
import * as coreOperations from '../../../../../../core'
import * as gateKeeperOperations from '../../../gatekeeper'
import { OrderDirection, OrderStatus } from '@abx-types/order'
import * as depthOperations from '../../../order-match-handling/depth'
import { OrderCancellationHandler } from '../../../order-match-handling/cancellation/order_cancellation_handler'
import * as reserveReleaseOperations from '../../../order-match-handling/cancellation/reserve-release-handlers'
import { createOrder } from '../test-utils'
import { OrderMatchRepository } from '../../../../../../core'

const cancellationReason = 'Cancellation reason'
const orderId = 111
const accountId = '123123123'
const symbolId = 'KAU_USD'

const state = {
  depth: {
    orders: {
      symbolId: {
        [OrderDirection.buy]: [],
        [OrderDirection.sell]: [],
      },
    },
    broadcast: {
      depthUpdated: sinon.mock(),
    },
  },
  handler: {
    broadcast: {
      orderUpdated: sinon.mock(),
      orderMatched: sinon.mock(),
    },
  },
} as any

const account = {
  id: '12313',
  status: AccountStatus.emailVerified,
  suspended: false,
}

describe('OrderCancellationHandlerTest', () => {
  const orderCancellationHandler = OrderCancellationHandler.getInstance()
  let releaseRemainingReserveForCancelledOrderStub
  let saveOrderStub
  let removeOrderStub

  beforeEach(() => {
    sinon.restore()
    releaseRemainingReserveForCancelledOrderStub = sinon.stub(reserveReleaseOperations, 'releaseRemainingReserveForCancelledOrder')
    saveOrderStub = sinon.stub(coreOperations, 'saveOrder')
    state.handler.broadcast.orderUpdated = sinon.mock()
    state.depth.broadcast.depthUpdated = sinon.mock()
    OrderCancellationHandler.refreshCurrencyToAccountIdsCancellingOrdersFor()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('handleOrderCancellation should pass error to callback when error thrown', async () => {
    const order = createOrder({ orderId, accountId, symbolId, direction: OrderDirection.sell })
    removeOrderStub = sinon.stub(depthOperations, 'removeOrderFromDepth').throws('foo')

    saveOrderStub.callsFake(() => Promise.resolve(order))

    try {
      await orderCancellationHandler.handleOrderCancellation(state, order, cancellationReason)
    } catch (e) {
      expect(removeOrderStub.calledWith(order, state.depth)).to.eql(true)
      expect(state.depth.broadcast.depthUpdated.notCalled).to.eql(true)
      expect(releaseRemainingReserveForCancelledOrderStub.notCalled).to.eql(true)
      expect(state.handler.broadcast.orderUpdated.notCalled).to.eql(true)
      expect(saveOrderStub.notCalled).to.eql(true)
    }
  }).timeout(60_000)

  it('handleOrderCancellation for sell order should remove order from depth, change order status and release reserved balance from to currency', async () => {
    const order = createOrder({ orderId, accountId, symbolId, direction: OrderDirection.sell })
    removeOrderStub = sinon.stub(depthOperations, 'removeOrderFromDepth').callsFake(() => ({ orderRemoved: true, topOfDepthUpdated: true }))
    sinon.stub(coreOperations, 'findOrder').callsFake(() => Promise.resolve(order))

    saveOrderStub.callsFake(() => Promise.resolve(order))

    await orderCancellationHandler.handleOrderCancellation(state, order, cancellationReason)

    expect(removeOrderStub.calledWith(order, state.depth)).to.eql(true)
    expect(state.depth.broadcast.depthUpdated.calledWith(order.symbolId, order.direction, state.depth.orders[symbolId], true)).to.eql(true)
    expect(releaseRemainingReserveForCancelledOrderStub.getCall(0).args[0]).to.eql(order)
    expect(state.handler.broadcast.orderUpdated.calledWith(order)).to.eql(true)
    expect({ ...saveOrderStub.getCall(0).args[0], transaction: undefined }).to.eql({
      order: { ...order, status: OrderStatus.cancel },
      cancellationReason,
      transaction: undefined,
    })
  })

  it('handleOrderCancellation should not take any action if order has been filled', async () => {
    const order = createOrder({ orderId, accountId, symbolId, direction: OrderDirection.buy })
    removeOrderStub = sinon.stub(depthOperations, 'removeOrderFromDepth').callsFake(() => ({ orderRemoved: true, topOfDepthUpdated: true }))
    sinon.stub(coreOperations, 'findOrder').callsFake(() => Promise.resolve({ ...order, status: OrderStatus.fill }))

    try {
      await orderCancellationHandler.handleOrderCancellation(state, order, cancellationReason)
    } catch (e) {
      expect(removeOrderStub.calledWith(order, state.depth)).to.eql(true)
      expect(state.depth.broadcast.depthUpdated.calledWith(order.symbolId, order.direction, state.depth.orders[symbolId], true)).to.eql(true)
      expect(releaseRemainingReserveForCancelledOrderStub.notCalled).to.eql(true)
      expect(state.handler.broadcast.orderUpdated.notCalled).to.eql(true)
      expect(saveOrderStub.notCalled).to.eql(true)
    }
  }).timeout(60_000)

  it('handleOrderCancellation should not take any action if order has been cancelled already', async () => {
    const order = createOrder({ orderId, accountId, symbolId, direction: OrderDirection.buy })
    removeOrderStub = sinon.stub(depthOperations, 'removeOrderFromDepth').callsFake(() => ({ orderRemoved: true, topOfDepthUpdated: true }))
    sinon.stub(coreOperations, 'findOrder').callsFake(() => Promise.resolve({ ...order, status: OrderStatus.cancel }))

    try {
      await orderCancellationHandler.handleOrderCancellation(state, order, cancellationReason)
    } catch (e) {
      expect(state.depth.broadcast.depthUpdated.calledWith(order.symbolId, order.direction, state.depth.orders[symbolId], true)).to.eql(true)
      expect(removeOrderStub.calledWith(order, state.depth)).to.eql(true)
      expect(releaseRemainingReserveForCancelledOrderStub.notCalled).to.eql(true)
      expect(state.handler.broadcast.orderUpdated.notCalled).to.eql(true)
      expect(saveOrderStub.notCalled).to.eql(true)
    }
  })

  it('handleOrderCancellation should not proceed with balance release when not all order matches settled', async () => {
    const order = createOrder({ orderId, accountId, symbolId, direction: OrderDirection.buy })
    removeOrderStub = sinon.stub(depthOperations, 'removeOrderFromDepth').callsFake(() => ({ orderRemoved: true, topOfDepthUpdated: true }))
    const addToQueueStub = sinon.stub(gateKeeperOperations, 'addToQueue').resolves(order)

    sinon.stub(coreOperations, 'findOrder').callsFake(() => Promise.resolve({ ...order, status: OrderStatus.pendingCancel }))
    sinon.stub(coreOperations, 'countTradeTransaction').resolves(1)
    sinon.stub(OrderMatchRepository.prototype, 'getOrderMatchCountForOrder').resolves(2)

    try {
      await orderCancellationHandler.handleOrderCancellation(state, order, cancellationReason)
    } catch (e) {
      expect(state.depth.broadcast.depthUpdated.calledWith(order.symbolId, order.direction, state.depth.orders[symbolId], true)).to.eql(true)
      expect(removeOrderStub.calledWith(order, state.depth)).to.eql(true)
      expect(releaseRemainingReserveForCancelledOrderStub.notCalled).to.eql(true)
      expect(state.handler.broadcast.orderUpdated.notCalled).to.eql(true)
      expect(saveOrderStub.notCalled).to.eql(true)
      expect(
        addToQueueStub.calledWith(order.symbolId, {
          requestType: 'cancel',
          cancellationReason: 'pending cancelled order picked up after hydration',
          order,
        }),
      ).to.eql(true)
    }
  })

  it('handleOrderCancellation for buy order should remove order from depth, change order status and release reserved balance from base currency, when all order matches settled', async () => {
    const maxFeeRate = 10
    const order = createOrder({ orderId, accountId, symbolId, direction: OrderDirection.buy })
    sinon.stub(coreOperations, 'getMaxFeeRate').callsFake(() => Promise.resolve(maxFeeRate))
    sinon.stub(accountOperations, 'findAccountById').callsFake(() => Promise.resolve(account))
    sinon.stub(coreOperations, 'findOrder').callsFake(() => Promise.resolve(order))
    sinon.stub(coreOperations, 'countTradeTransaction').resolves(2)
    sinon.stub(OrderMatchRepository.prototype, 'getOrderMatchCountForOrder').resolves(2)

    removeOrderStub = sinon.stub(depthOperations, 'removeOrderFromDepth').callsFake(() => ({ orderRemoved: true, topOfDepthUpdated: true }))
    saveOrderStub.callsFake(() => Promise.resolve(order))

    await orderCancellationHandler.handleOrderCancellation(state, order, cancellationReason)

    expect(state.depth.broadcast.depthUpdated.calledWith(order.symbolId, order.direction, state.depth.orders[symbolId], true)).to.eql(true)
    expect(removeOrderStub.calledWith(order, state.depth)).to.eql(true)
    expect(releaseRemainingReserveForCancelledOrderStub.getCall(0).args[0]).to.eql(order)
    expect({ ...saveOrderStub.getCall(0).args[0], transaction: undefined }).to.eql({
      order: { ...order, status: OrderStatus.cancel },
      cancellationReason,
      transaction: undefined,
    })
  }).timeout(60_000)
})
