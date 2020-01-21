import {
  placeBuyMarketOrder,
  placeSellLimitOrder,
  verifyFeeAddedToOperatorAccount,
  waitForSellOrderToAppearInDepth,
  KAU,
  USD,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  waitToBeCancelled,
  verifyAvailableBalanceUpdateCall,
} from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import { SourceEventType } from '@abx-types/balance'
import { expect } from 'chai'
import Decimal from 'decimal.js'

describe('Market Orders: Buy', async () => {
  let pair
  let updateAvailable: sinon.SinonStub
  let reserveBalanceStub: sinon.SinonStub

  beforeEach(async function() {
    this.timeout(10_000)
    const { symbol, updateAvailableStub, balanceReserveStub } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
    reserveBalanceStub = balanceReserveStub
  })

  it('Market Order - Partially Filled - BUY (fees in base)', async () => {
    const [{ accountId: buyerId }, { accountId: sellerId }] = await createTestTradingAccounts(3)

    const sellOrder = await placeSellLimitOrder({ amount: 10, limitPrice: 55, sellerAccountId: sellerId, pair })
    await waitForSellOrderToAppearInDepth({ orderId: sellOrder.id, pair, account: sellerId })

    const buyMarketOrder = await placeBuyMarketOrder({
      amount: 20,
      buyerAccountId: buyerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([
      {
        orderId: buyMarketOrder.id!,
        accountId: buyerId,
        currencyCode: USD.currency,
        expectedInitialReserve: sellOrder.amount * sellOrder.limitPrice!,
      },
    ])

    await waitToBeCancelled(buyMarketOrder.id!)

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.2, pair.fee.id)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: USD.id,
        accountId: buyMarketOrder.accountId,
        amount: sellOrder.amount * sellOrder.limitPrice!,
        sourceEventId: buyMarketOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      buyMarketOrder.accountId,
      new Decimal(sellOrder.amount)
        .times(1 - DEFAULT_TEST_FEE_RATE)
        .toDP(KAU.boundary?.maxDecimals!, Decimal.ROUND_DOWN)
        .toNumber(),
      KAU.id,
    )
  }).timeout(60_000)
})
