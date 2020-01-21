import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  waitForOrderToAppearInBuyDepth,
  createTestTradingAccounts,
  ETH,
  KAG,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import Decimal from 'decimal.js'
import { expect } from 'chai'
import { waitForSettlement } from '../../utils/settlement_waiter'
import { SourceEventType } from '@abx-types/balance'

describe('Limit Orders: Buy', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  const customFeeRate = 0

  beforeEach(async function() {
    const { symbol, balanceReserveStub } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: KAG,
      feeCurrency: KAG,
      customFeeRate,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
  })

  it('Limit Order - Resting (Full) - fee rate 0', async function() {
    const [{ accountId: buyerId }, { accountId: seller1Id }, { accountId: seller2Id }, { accountId: seller3Id }] = await createTestTradingAccounts(4)

    const buyOrder = await placeBuyLimitOrder({ amount: 65, limitPrice: 36.65432, buyerAccountId: buyerId, pair })

    const expectedInitialReserve = new Decimal(buyOrder.amount)
      .times(buyOrder.limitPrice!)
      .toDP(KAG.boundary?.maxDecimals!, Decimal.ROUND_DOWN)
      .toNumber()
    await waitForOrderToAppearInBuyDepth(pair, buyOrder.id!)

    stubBalanceReserveAdjustmentCalls([
      {
        orderId: buyOrder.id!,
        accountId: buyOrder.accountId,
        currencyCode: KAG.currency,
        expectedInitialReserve: expectedInitialReserve,
      },
      {
        orderId: 2,
        accountId: seller1Id,
        currencyCode: ETH.currency,
        expectedInitialReserve: 9,
      },
      {
        orderId: 3,
        accountId: seller2Id,
        currencyCode: ETH.currency,
        expectedInitialReserve: 9,
      },
      {
        orderId: 4,
        accountId: seller3Id,
        currencyCode: ETH.currency,
        expectedInitialReserve: 47,
      },
    ])

    const sellOrder1 = await placeSellLimitOrder({
      amount: 9,
      limitPrice: 36.65432,
      sellerAccountId: seller1Id,
      pair,
    })

    const sellOrder2 = await placeSellLimitOrder({
      amount: 9,
      limitPrice: 36.65432,
      sellerAccountId: seller2Id,
      pair,
    })

    const sellOrder3 = await placeSellLimitOrder({
      amount: 47,
      limitPrice: 36.65432,
      sellerAccountId: seller3Id,
      pair,
    })

    await waitForSettlement(sellOrder1.id!, 'sell')
    await waitForSettlement(sellOrder2.id!, 'sell')
    await waitForSettlement(sellOrder3.id!, 'sell')

    expect(
      reserveBalanceStub.calledWith({
        currencyId: KAG.id,
        accountId: buyOrder.accountId,
        amount: expectedInitialReserve,
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
