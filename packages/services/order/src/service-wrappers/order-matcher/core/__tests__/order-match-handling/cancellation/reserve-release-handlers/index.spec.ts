import { expect } from 'chai'
import sinon from 'sinon'
import * as symbolOperations from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { OrderDirection } from '@abx-types/order'
import { releaseRemainingReserveForCancelledOrder } from '../../../../order-match-handling/cancellation/reserve-release-handlers'
import * as buyReserveReleaseHandler from '../../../../order-match-handling/cancellation/reserve-release-handlers/buy_reserve_release_handler'
import * as sellReserveReleaseHandler from '../../../../order-match-handling/cancellation/reserve-release-handlers/sell_reserve_release_handler'
import { createOrder } from '../../test-utils'

const symbol = {
  id: 'KAU_USD',
  base: {
    id: 1,
    code: CurrencyCode.kau,
    sortPriority: 1,
    orderPriority: 1,
  },
  quote: {
    id: 2,
    code: CurrencyCode.usd,
    sortPriority: 2,
    orderPriority: 2,
  },
  fee: {
    id: 1,
    code: CurrencyCode.kau,
    sortPriority: 1,
    orderPriority: 1,
  },
  orderRange: 0.3,
}

describe('releaseRemainingReserveForCancelledOrder', () => {
  let getSymbolDetailsStub
  let buyOrderReleaseStub
  let sellOrderReleaseStub

  beforeEach(() => {
    sinon.restore()
    getSymbolDetailsStub = sinon.stub(symbolOperations, 'getCompleteSymbolDetails').callsFake(() => Promise.resolve(symbol))
    buyOrderReleaseStub = sinon.stub(buyReserveReleaseHandler, 'releaseRemainingReserveForBuyOrder')
    sellOrderReleaseStub = sinon.stub(sellReserveReleaseHandler, 'releaseRemainingReserveForSellOrder')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should call releaseRemainingReserveForSellOrder when sell order', async () => {
    const order = createOrder({ orderId: 1, accountId: '12', symbolId: symbol.id, direction: OrderDirection.sell })

    await releaseRemainingReserveForCancelledOrder(order)

    expect(getSymbolDetailsStub.calledWith(symbol.id)).to.eql(true)
    expect(sellOrderReleaseStub.calledWith(symbol, order)).to.eql(true)
  })

  it('should call releaseRemainingReserveForBuyOrder when buy order', async () => {
    const order = createOrder({ orderId: 1, accountId: '12', symbolId: symbol.id, direction: OrderDirection.buy })

    await releaseRemainingReserveForCancelledOrder(order)

    expect(getSymbolDetailsStub.calledWith(symbol.id)).to.eql(true)
    expect(buyOrderReleaseStub.calledWith(symbol, order)).to.eql(true)
  })
})
