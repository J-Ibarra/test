import { expect } from 'chai'
import { v4 } from 'node-uuid'
import sinon from 'sinon'
import { SourceEventType } from '@abx-types/balance'
import * as boundaryOperations from '@abx-service-clients/reference-data'
import { sequelize } from '@abx/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { OrderDirection } from '@abx-types/order'
import * as balanceOperations from '@abx-service-clients/balance'
import { releaseRemainingReserveForBuyOrder } from '../../../../order-match-handling/cancellation/reserve-release-handlers/buy_reserve_release_handler'
import * as reserveCancellationUtils from '../../../../../../../core'
import { createOrder } from '../../test-utils'

const stubbedMaxDecimalBoundary = 5
const symbol = {
  id: `${CurrencyCode.kau}_${CurrencyCode.usd}`,
  base: {
    id: 1,
    code: CurrencyCode.kau,
  },
  quote: {
    id: 2,
    code: CurrencyCode.usd,
  },
} as any

describe('releaseRemainingReserveForBuyOrder', () => {
  let balanceMovementFacadeStub
  let boundaryOperationsStub

  beforeEach(() => {
    sinon.restore()
    balanceMovementFacadeStub = sinon.stub(balanceOperations, 'releaseReserve').callsFake(() => Promise.resolve())
    boundaryOperationsStub = sinon.stub(boundaryOperations, 'findBoundaryForCurrency').resolves(stubbedMaxDecimalBoundary)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should release remaining * limitPrice when base currency is fee currency', async () => {
    const order = createOrder({
      orderId: 1,
      accountId: v4(),
      symbolId: symbol.id,
      direction: OrderDirection.buy,
      remaining: 10,
    })
    sinon.stub(reserveCancellationUtils, 'retrieveInitialReserveForOrder').resolves(order.remaining * order.limitPrice!)
    await sequelize.transaction(async t => {
      await releaseRemainingReserveForBuyOrder(symbol, order)

      expect(
        balanceMovementFacadeStub.calledWith({
          currencyId: symbol.quote.id,
          accountId: order.accountId,
          amount: order.remaining * order.limitPrice!,
          sourceEventId: order.id,
          sourceEventType: SourceEventType.orderCancellation,
          t,
        }),
      ).to.eql(true)
      expect(boundaryOperationsStub.calledWith(symbol.quote.code)).to.eql(true)
    })
  })

  it('should release max reserve(reserved initially) when quote currency is fee currency', async () => {
    const maxReserve = 12
    sinon.stub(reserveCancellationUtils, 'retrieveInitialReserveForOrder').resolves(maxReserve)

    const order = createOrder({
      orderId: 1,
      accountId: v4(),
      symbolId: symbol.id,
      direction: OrderDirection.buy,
    })
    await sequelize.transaction(async t => {
      await releaseRemainingReserveForBuyOrder(symbol, order)

      expect(
        balanceMovementFacadeStub.calledWith({
          currencyId: symbol.quote.id,
          accountId: order.accountId,
          amount: maxReserve,
          sourceEventId: order.id,
          sourceEventType: SourceEventType.orderCancellation,
          t,
        }),
      ).to.eql(true)
      expect(boundaryOperationsStub.calledWith(symbol.quote.code)).to.eql(true)
    })
  })
})
