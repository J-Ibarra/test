import {
  placeBuyLimitOrder,
  placeSellLimitOrder,
  createTestTradingAccounts,
  verifyAvailableBalanceUpdateCall,
  waitForOrderToAppearInSellDepth,
  cancelOrder,
  KAG,
  EUR,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'
import Decimal from 'decimal.js'
import { expect } from 'chai'
import { SourceEventType } from '@abx-types/balance'
import { waitForSettlement } from '../../utils/settlement_waiter'
import { setAccountFeeTiers } from '../../../../core'

describe('Limit Orders: Sell', async () => {
  let pair
  let updateAvailable: sinon.SinonStub
  let reserveBalanceStub: sinon.SinonStub
  let releaseReserveStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, updateAvailableStub, balanceReserveStub, releaseReserve } = await setUp({
      baseCurrency: KAG,
      quoteCurrency: EUR,
      feeCurrency: KAG,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
    reserveBalanceStub = balanceReserveStub
    releaseReserveStub = releaseReserve
  })

  it('Limit Order - partial filled - with seller (market maker) order cancelled - returning correct funds', async () => {
    const [{ accountId: buyerId1 }, { accountId: marketMakerId }] = await createTestTradingAccounts(3)

    await setAccountFeeTiers([{ accountId: marketMakerId, tier: 0, symbolId: pair.id, rate: 0, threshold: 500_000_000 }])

    const sellLimitOrder = await placeSellLimitOrder({
      amount: 287.72106,
      limitPrice: 15.67,
      sellerAccountId: marketMakerId,
      pair,
    })
    await waitForOrderToAppearInSellDepth(pair, sellLimitOrder.id!)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: KAG.id,
        accountId: sellLimitOrder.accountId,
        amount: 287.72106,
        sourceEventId: sellLimitOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    )

    const buyLimitOrder = await placeBuyLimitOrder({ amount: 1.33844, limitPrice: 15.67, buyerAccountId: buyerId1, pair })

    stubBalanceReserveAdjustmentCalls([
      {
        orderId: buyLimitOrder.id!,
        accountId: buyLimitOrder.accountId,
        currencyCode: EUR.currency,
        expectedInitialReserve: 1,
      },
      {
        orderId: sellLimitOrder.id!,
        accountId: sellLimitOrder.accountId,
        currencyCode: KAG.currency,
        expectedInitialReserve: sellLimitOrder.amount,
      },
    ])

    await waitForSettlement(sellLimitOrder.id!, 'sell')
    await cancelOrder(sellLimitOrder, true)

    verifyAvailableBalanceUpdateCall(
      updateAvailable,
      sellLimitOrder.accountId,
      new Decimal(1.33844)
        .times(sellLimitOrder.limitPrice!)
        .toDP(EUR.boundary!.maxDecimals)
        .toNumber(),
      EUR.id,
    )

    expect(
      releaseReserveStub.calledWith({
        currencyId: pair.base.id,
        accountId: sellLimitOrder.accountId,
        amount: 286.38262,
        sourceEventId: sellLimitOrder.id!,
        sourceEventType: SourceEventType.orderCancellation,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
