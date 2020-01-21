import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  KAU,
  verifySellOrderPresentInDepth,
  USD,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import Decimal from 'decimal.js'
import { expect } from 'chai'
import { waitForSettlement } from '../../utils/settlement_waiter'
import { SourceEventType } from '@abx-types/balance'
import { verifyFeeAddedToOperatorAccount } from '../../utils/balance-check.utils'

describe('Limit Orders: Buy', async () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let updateAvailable: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, updateAvailableStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    updateAvailable = updateAvailableStub
  })

  it('Limit Order - Filled (Full) - Single Order Match - No Reference Price Change - Not Same Traders Order - Price Match (quantity D.P. validation) - BUY (fees in base)', async () => {
    const [{ accountId: buyerId }, { accountId: sellerId }] = await createTestTradingAccounts(2)

    const sellOrder = await placeSellLimitOrder({
      amount: 20,
      limitPrice: 30,
      sellerAccountId: sellerId,
      pair,
    })

    const buyOrder = await placeBuyLimitOrder({
      amount: 10,
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
    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.2, KAU.id)
    await verifySellOrderPresentInDepth({ orderId: sellOrder.id, pair, expectedRemaining: 10 })

    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.quote.id,
        accountId: buyOrder.accountId,
        amount: expectedInitialReserve,
        sourceEventId: buyOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
