import { placeBuyMarketOrder, placeSellLimitOrder, ETH, KAU, createTestTradingAccounts, stubBalanceReserveAdjustmentCalls } from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import { waitForSettlement } from '../../utils/settlement_waiter'
import { OrderDirection } from '@abx-types/order'
import { expect } from 'chai'
import Decimal from 'decimal.js'
import { SourceEventType } from '@abx-types/balance'

describe('Market Orders: Buy', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: KAU,
      feeCurrency: KAU,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
  })

  it('Market Order Buy - partially filled - cancelled - fee taken from quote ', async function() {
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
        currencyCode: KAU.currency,
        expectedInitialReserve: sellOrder1.amount * sellOrder1.limitPrice! * (1 + DEFAULT_TEST_FEE_RATE),
      },
      {
        orderId: buyOrder.id!,
        accountId: buyerId,
        currencyCode: KAU.currency,
        expectedInitialReserve: sellOrder2.amount * sellOrder2.limitPrice! * (1 + DEFAULT_TEST_FEE_RATE),
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
          .times(1 + DEFAULT_TEST_FEE_RATE)
          .toDP(KAU.boundary!.maxDecimals, Decimal.ROUND_DOWN)
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
          .times(1 + DEFAULT_TEST_FEE_RATE)
          .toDP(KAU.boundary!.maxDecimals, Decimal.ROUND_DOWN)
          .toNumber(),
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
