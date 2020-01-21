import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
  verifyAvailableBalanceUpdateCall,
  KAU,
  ETH,
  USD,
  waitForOrderToAppearInSellDepth,
  cancelOrder,
} from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import Decimal from 'decimal.js'
import { expect } from 'chai'
import { SourceEventType } from '@abx-types/balance'
import { waitForSettlement } from '../../utils/settlement_waiter'

describe('Limit Orders: Sell', async () => {
  let pair
  let updateAvailable: sinon.SinonStub
  let reserveBalanceStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, updateAvailableStub, balanceReserveStub } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: USD,
      feeCurrency: ETH,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
    reserveBalanceStub = balanceReserveStub
  })

  it('Limit Order - filled - with buy order cancelled - returning correct funds', async () => {
    const [{ accountId: buyer1Id }, { accountId: sellerId }] = await createTestTradingAccounts(3)

    const sellLimitOrder = await placeSellLimitOrder({
      amount: 15,
      limitPrice: 100,
      sellerAccountId: sellerId,
      pair,
    })
    await waitForOrderToAppearInSellDepth(pair, sellLimitOrder.id!)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: ETH.id,
        accountId: sellLimitOrder.accountId,
        amount: sellLimitOrder.amount,
        sourceEventId: sellLimitOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    )

    const buyLimitOrder = await placeBuyLimitOrder({ amount: 1324.235, limitPrice: 186.45, buyerAccountId: buyer1Id, pair })

    const expectedBuyOrderInitialReserve = new Decimal(buyLimitOrder.amount)
      .times(buyLimitOrder.limitPrice!)
      .toDP(USD.boundary!.maxDecimals, Decimal.ROUND_DOWN)
      .toNumber()
    stubBalanceReserveAdjustmentCalls([
      {
        orderId: buyLimitOrder.id!,
        accountId: buyLimitOrder.accountId,
        currencyCode: USD.currency,
        expectedInitialReserve: expectedBuyOrderInitialReserve,
      },
      {
        orderId: sellLimitOrder.id!,
        accountId: sellLimitOrder.accountId,
        currencyCode: KAU.currency,
        expectedInitialReserve: sellLimitOrder.amount * DEFAULT_TEST_FEE_RATE,
      },
    ])

    await waitForSettlement(sellLimitOrder.id!, 'sell')

    await cancelOrder(buyLimitOrder, true)
    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellLimitOrder.accountId,
      new Decimal(sellLimitOrder.amount)
        .times(sellLimitOrder.limitPrice!)
        .toDP(USD.boundary!.maxDecimals)
        .toNumber(),
      USD.id,
    )
  }).timeout(60_000)
})
