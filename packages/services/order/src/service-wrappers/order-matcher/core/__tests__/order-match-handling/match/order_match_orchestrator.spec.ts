import { expect } from 'chai'
import sinon from 'sinon'
import { OrderDirection } from '@abx-types/order'
import * as depthOperations from '../../../order-match-handling/depth'
import * as matchOperations from '../../../order-match-handling/match/matcher/matcher'
import { matchOrderAgainstDepth } from '../../../order-match-handling/match/matcher/order_match_orchestrator'
import * as updateEventDispatcherOperations from '../../../order-match-handling/match/matcher/update_event_dispatcher'
import * as validatorOperations from '../../../order-match-handling/match/matcher/validator'
import { createOrder } from '../test-utils'

const handler = {} as any
const depth = {} as any
const state = {
  depth,
  handler,
} as any

describe('order_match_orchestrator', () => {
  beforeEach(() => {
    sinon.restore()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should matchOrder and add to depth if remaining amount present and order limit buy', async () => {
    const order = await createOrder({
      orderId: 1,
      accountId: 'testAccount2',
      symbolId: 'foo',
      direction: OrderDirection.buy,
    })
    const validateOrderExpiryStub = sinon.stub(validatorOperations, 'validateOrderExpiry').callsFake(() => Promise.resolve())
    const matchOrderStub = sinon.stub(matchOperations, 'matchOrder').callsFake(() => Promise.resolve({ order, orderUpdates: [], orderMatches: [] }))
    const addOrderToDepthStub = sinon.stub(depthOperations, 'addOrderToDepth').callsFake(() => Promise.resolve(order))
    const broadcastUpdateStub = sinon.stub(updateEventDispatcherOperations, 'broadcastUpdates').callsFake(() => Promise.resolve())

    await matchOrderAgainstDepth(order, state)
    expect(validateOrderExpiryStub.calledOnce).to.eql(true)
    expect(matchOrderStub.getCalls()[0].args[0]).to.eql(order)
    expect(matchOrderStub.getCalls()[0].args[1]).to.eql(state)
    expect(addOrderToDepthStub.calledWith(order, depth)).to.eql(true)
    expect(broadcastUpdateStub.calledWith([], [], handler)).to.eql(true)
  })
})
