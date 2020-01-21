import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  verifyReleaseReserveCall,
  KAU,
  subscribeToDepthUpdateEvents,
  verifyTopOfAskDepthUpdatedEventDispatched,
  USD,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { expect } from 'chai'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'
import Decimal from 'decimal.js'
import { SourceEventType } from '@abx-types/balance'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Limit Orders: Buy', async () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let updateAvailable: sinon.SinonStub
  let finaliseReserve: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, updateAvailableStub, finaliseReserveStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    updateAvailable = updateAvailableStub
    finaliseReserve = finaliseReserveStub
  })

  it('Limit Order - Filled (Full) - Multiple Order Match - Multiple Depth Levels -  Run Through All Depth - BUY (fees in base)', async () => {
    subscribeToDepthUpdateEvents()
    const [{ accountId: buyerId }, { accountId: seller1Id }, { accountId: seller2Id }, { accountId: seller3Id }] = await createTestTradingAccounts(4)

    const sellOrder1 = await placeSellLimitOrder({ amount: 10, limitPrice: 20, sellerAccountId: seller1Id, pair })
    const sellOrder2 = await placeSellLimitOrder({ amount: 10, limitPrice: 25, sellerAccountId: seller2Id, pair })
    await placeSellLimitOrder({ amount: 10, limitPrice: 30, sellerAccountId: seller3Id, pair })

    const buyOrder = await placeBuyLimitOrder({
      amount: 30,
      limitPrice: 30,
      buyerAccountId: buyerId,
      pair,
    })
    const expectedInitialReserve = new Decimal(buyOrder.amount)
      .times(buyOrder.limitPrice!)
      .toDP(KAU.boundary!.maxDecimals, Decimal.ROUND_DOWN)
      .toNumber()

    stubBalanceReserveAdjustmentCalls([
      { orderId: buyOrder.id!, accountId: buyerId, currencyCode: USD.currency, expectedInitialReserve: expectedInitialReserve },
    ])

    await waitForSettlement(buyOrder.id!, 'buy')

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.6, pair.fee.id)
    await verifyTopOfAskDepthUpdatedEventDispatched(30)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.quote.id,
        accountId: buyOrder.accountId,
        amount: expectedInitialReserve,
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    verifyReleaseReserveCall(
      finaliseReserve,
      buyOrder.accountId,
      new Decimal(sellOrder1.amount)
        .times(sellOrder1.limitPrice!)
        .toDP(USD.boundary!.maxDecimals, Decimal.ROUND_DOWN)
        .toNumber(),
      USD.id,
      SourceEventType.orderMatchRelease,
    )

    verifyReleaseReserveCall(
      finaliseReserve,
      buyOrder.accountId,
      new Decimal(sellOrder2.amount)
        .times(sellOrder2.limitPrice!)
        .toDP(USD.boundary!.maxDecimals, Decimal.ROUND_DOWN)
        .toNumber(),
      USD.id,
      SourceEventType.orderMatchRelease,
    )
  }).timeout(60_000)
})
