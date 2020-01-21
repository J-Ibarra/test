import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  ETH,
  KAG,
  stubBalanceReserveAdjustmentCalls,
  subscribeToDepthUpdateEvents,
  verifyTopOfBidDepthUpdatedEventDispatched,
  verifyTopOfAskDepthUpdatedEventDispatched,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import Decimal from 'decimal.js'
import { expect } from 'chai'
import { waitForSettlement } from '../../utils/settlement_waiter'
import { SourceEventType } from '@abx-types/balance'
import { SymbolPair } from '@abx-types/reference-data'

describe('Limit Orders: Buy', async () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  const customFeeRate = 0.0022

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

  it('Limit Order - Filled at multiple levels - reserve balance remaining', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyerId }, { accountId: seller1Id }, { accountId: seller2Id }] = await createTestTradingAccounts(4)

    await placeSellOrders(pair, seller1Id, seller2Id)

    const buyOrder = await placeBuyLimitOrder({
      amount: 15.84759,
      limitPrice: 25.25,
      buyerAccountId: buyerId,
      pair,
    })
    stubBalanceReserveAdjustmentCalls([
      {
        orderId: buyOrder.id!,
        accountId: buyOrder.accountId,
        currencyCode: KAG.currency,
        expectedInitialReserve: 1,
      },
    ])

    await waitForSettlement(buyOrder.id!, 'buy')

    await verifyTopOfBidDepthUpdatedEventDispatched(0)
    await verifyTopOfAskDepthUpdatedEventDispatched(25.25)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: KAG.id,
        accountId: buyOrder.accountId,
        amount: new Decimal(buyOrder.amount)
          .times(buyOrder.limitPrice!)
          .times(1 + customFeeRate)
          .toDP(KAG.boundary?.maxDecimals!, Decimal.ROUND_DOWN)
          .toNumber(),
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    )
  }).timeout(60_000)
})

const placeSellOrders = async (pair: SymbolPair, sellerId1: string, sellerId2: string) => {
  await placeSellLimitOrder({
    amount: 10.0001,
    limitPrice: 25.25,
    sellerAccountId: sellerId1,
    pair,
  })
  await placeSellLimitOrder({
    amount: 10.0001,
    limitPrice: 25.25,
    sellerAccountId: sellerId2,
    pair,
  })

  await placeSellLimitOrder({
    amount: 10.28464,
    limitPrice: 30.34,
    sellerAccountId: sellerId1,
    pair,
  })
  await placeSellLimitOrder({
    amount: 10.71,
    limitPrice: 35.44,
    sellerAccountId: sellerId2,
    pair,
  })
}
