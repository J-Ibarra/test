import { expect } from 'chai'
import sinon from 'sinon'
import { SourceEventType } from '@abx-types/balance'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as libOperations from '../../../../../../../core'
import * as balanceOperations from '@abx-service-clients/balance'
import { CurrencyCode } from '@abx-types/reference-data'
import { OrderDirection } from '@abx-types/order'
import { releaseRemainingReserveForSellOrder } from '../../../../order-match-handling/cancellation/reserve-release-handlers/sell_reserve_release_handler'
import { createOrder, createSymbol } from '../../test-utils'

const transaction = {} as any
const stubbedMaxDecimalBoundary = 5

describe('releaseRemainingReserveForSellOrder', () => {
  let balanceMovementFacadeStub
  let boundaryOperationsStub

  beforeEach(() => {
    sinon.restore()
    balanceMovementFacadeStub = sinon.stub(balanceOperations, 'releaseReserve').callsFake(() => Promise.resolve())
    boundaryOperationsStub = sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves(stubbedMaxDecimalBoundary)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should release remaining when quote currency is fee currency', async () => {
    const feeTakenFromBaseStub = sinon.stub(referenceDataOperations, 'feeTakenFromBase').callsFake(() => false)

    const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.kag, CurrencyCode.kag)
    const order = createOrder({
      orderId: 1,
      accountId: '12',
      symbolId: symbol.id,
      direction: OrderDirection.sell,
      remaining: 10,
    })
    sinon.stub(libOperations, 'retrieveInitialReserveForOrder').resolves(order.remaining)

    await releaseRemainingReserveForSellOrder(symbol, order)

    expect(feeTakenFromBaseStub.calledWith(symbol)).to.eql(true)
    expect(
      balanceMovementFacadeStub.calledWith({
        currencyId: symbol.base.id,
        accountId: order.accountId,
        amount: order.remaining,
        sourceEventId: order.id,
        sourceEventType: SourceEventType.orderCancellation,
        t: transaction,
      }),
    ).to.eql(true)
  })

  it('should release max reserve(reserved initially) when base currency is fee currency', async () => {
    const maxReserve = 12
    const feeTakenFromBaseStub = sinon.stub(referenceDataOperations, 'feeTakenFromBase').callsFake(() => true)
    sinon.stub(libOperations, 'determineMaxReserveForTradeValue').callsFake(() => Promise.resolve(maxReserve))

    const symbol = createSymbol(CurrencyCode.kau, CurrencyCode.usd, CurrencyCode.kau)
    const order = createOrder({
      orderId: 1,
      accountId: '12',
      symbolId: symbol.id,
      direction: OrderDirection.sell,
    })
    sinon.stub(libOperations, 'retrieveInitialReserveForOrder').resolves(maxReserve)

    await releaseRemainingReserveForSellOrder(symbol, order)

    expect(feeTakenFromBaseStub.calledWith(symbol)).to.eql(true)
    expect(
      balanceMovementFacadeStub.calledWith({
        currencyId: symbol.base.id,
        accountId: order.accountId,
        amount: maxReserve,
        sourceEventId: order.id,
        sourceEventType: SourceEventType.orderCancellation,
        t: transaction,
      }),
    ).to.eql(true)
    expect(boundaryOperationsStub.calledWith(symbol.base.code)).to.eql(true)
  })
})
