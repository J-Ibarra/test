import { placeBuyMarketOrder, placeSellLimitOrder, ETH, USD, createTestTradingAccounts, stubBalanceReserveAdjustmentCalls } from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { OrderDirection } from '@abx-types/order'
import { expect } from 'chai'
import { waitForSettlement } from '../../utils/settlement_waiter'
import { SourceEventType } from '@abx-types/balance'
import Decimal from 'decimal.js'

describe('Market Orders: Buy', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let releaseReserveStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, releaseReserve } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: USD,
      feeCurrency: ETH,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    releaseReserveStub = releaseReserve
  })

  it('Market Order Buy - partially filled - cancelled - fee taken from base ', async function() {
    const [{ accountId: buyerId }, { accountId: seller1Id }, { accountId: seller2Id }] = await createTestTradingAccounts(3)

    const sellOrder1 = await placeSellLimitOrder({
      amount: 0.000055,
      limitPrice: 186.45,
      sellerAccountId: seller1Id,
      pair,
    })
    const sellOrder2 = await placeSellLimitOrder({ amount: 1.4, limitPrice: 186.45, sellerAccountId: seller2Id, pair })

    const buyOrder = await placeBuyMarketOrder({ amount: 1.5, buyerAccountId: buyerId, pair })
    stubBalanceReserveAdjustmentCalls([
      {
        orderId: buyOrder.id!,
        accountId: buyerId,
        currencyCode: USD.currency,
        expectedInitialReserve: sellOrder1.amount * sellOrder1.limitPrice!,
      },
      {
        orderId: buyOrder.id!,
        accountId: buyerId,
        currencyCode: USD.currency,
        expectedInitialReserve: sellOrder2.amount * sellOrder2.limitPrice!,
      },
    ])
    await waitForSettlement(sellOrder1.id!, OrderDirection.sell)
    await waitForSettlement(sellOrder2.id!, OrderDirection.sell)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.quote.id,
        accountId: buyerId,
        amount: new Decimal(sellOrder1.amount)
          .times(sellOrder1.limitPrice!)
          .toDP(2, Decimal.ROUND_DOWN)
          .toNumber(),
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)
    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.quote.id,
        accountId: buyerId,
        amount: new Decimal(sellOrder2.amount)
          .times(sellOrder2.limitPrice!)
          .toDP(2, Decimal.ROUND_DOWN)
          .toNumber(),
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)
    expect(releaseReserveStub.calledOnce).to.eql(false)
  }).timeout(60_000)
})
