import { expect } from 'chai'
import sinon from 'sinon'
import { OrderDirection, OrderStatus, OrderType, OrderValidity } from '@abx-types/order'
import * as orderOperations from '../../../../core'
import * as queueOperations from '../add_to_queue'
import { OrderCancellationGateway } from '../order_cancellation_gateway'

const orderId = 1
const accountId = 'accountId'

describe('OrderCancellationGateway', () => {
  const orderCancellationGateway = OrderCancellationGateway.getInstance()

  beforeEach(async () => {
    sinon.restore()
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('cancelOrder should throw validation error when order not found', async () => {
    const findOrderStub = sinon.stub(orderOperations, 'findOrder')

    try {
      await orderCancellationGateway.cancelOrder({ orderId })
    } catch (e) {
      expect(e.message).to.eql(`Failed to cancel non-existent order ${orderId}`)
      findOrderStub.calledWith(orderId)
    }
  })

  it('cancelOrder should throw validation error when order filled', async () => {
    const orderToCancel = createOrder()
    const findOrderStub = sinon.stub(orderOperations, 'findOrder').callsFake(() => Promise.resolve({ ...orderToCancel, status: OrderStatus.fill }))

    try {
      await orderCancellationGateway.cancelOrder({ orderId })
    } catch (e) {
      expect(e.message).to.eql(`Order ${orderId} is in the wrong state for cancellation ${OrderStatus.fill}`)
      findOrderStub.calledWith(orderId)
    }
  })

  it('cancelOrder should put an order in pendingCancellation state', async () => {
    const orderToCancel = createOrder()
    const findOrderStub = sinon.stub(orderOperations, 'findOrder').callsFake(() => Promise.resolve(orderToCancel))
    const saveOrderStub = sinon.stub(orderOperations, 'saveOrder')
    const addToQueueStub = sinon.stub(queueOperations, 'addToQueue')

    await orderCancellationGateway.cancelOrder({ orderId })

    expect(findOrderStub.calledWith(orderId)).to.eql(true)
    expect({ ...saveOrderStub.getCall(0).args[0], transaction: undefined }).to.eql({
      order: { ...orderToCancel, status: OrderStatus.pendingCancel },
      transaction: undefined,
    })
    expect(addToQueueStub.calledOnce).to.eql(true)
  })

  it('cancelOrdersOnAccount should cancel all orders for account', async () => {
    const orderToCancel1 = createOrder()
    const orderToCancel2 = createOrder(2)

    sinon.stub(orderOperations, 'findOrders').callsFake(() => Promise.resolve([orderToCancel1, orderToCancel2]))
    const addToQueueStub = sinon.stub(queueOperations, 'addToQueue')
    sinon.stub(orderOperations, 'saveOrder')

    await orderCancellationGateway.cancelOrdersOnAccount({ accountId })

    expect(addToQueueStub.getCalls().length).to.eql(2)
  })
})

const createOrder = (id = orderId) => ({
  id,
  accountId,
  symbolId: 'KAU_USD',
  direction: OrderDirection.buy,
  amount: 10,
  remaining: 5,
  status: OrderStatus.submit,
  orderType: OrderType.limit,
  validity: OrderValidity.GTC,
})
