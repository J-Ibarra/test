import { cancelOrder, placeSellLimitOrder, ETH, KAU, createTestTradingAccounts, stubBalanceReserveAdjustmentCalls } from '../../utils'
import { setUp } from '../../utils/setup.utils'
import { expect } from 'chai'
import { SourceEventType } from '@abx-types/balance'

describe('Limit Orders: Sell', () => {
  let pair
  let reserveBalanceStub: sinon.SinonStub
  let releaseReserveStub: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, balanceReserveStub, releaseReserve } = await setUp({
      baseCurrency: ETH,
      quoteCurrency: KAU,
      feeCurrency: KAU,
    })
    pair = symbol
    reserveBalanceStub = balanceReserveStub
    releaseReserveStub = releaseReserve
  })

  it('Limit Order Sell - not partially filled - cancelled - fee taken from quote', async function() {
    const [{ accountId: sellerId }] = await createTestTradingAccounts()

    const sellOrder = await placeSellLimitOrder({ amount: 65, limitPrice: 36.65432, sellerAccountId: sellerId, pair })

    stubBalanceReserveAdjustmentCalls([
      {
        orderId: sellOrder.id!,
        accountId: sellOrder.accountId,
        currencyCode: ETH.currency,
        expectedInitialReserve: sellOrder.amount,
      },
    ])

    await cancelOrder(sellOrder, true)

    expect(
      reserveBalanceStub.calledWith({
        currencyId: pair.base.id,
        accountId: sellOrder.accountId,
        amount: sellOrder.amount,
        sourceEventId: sellOrder.id!,
        sourceEventType: 'order' as SourceEventType,
      }),
    ).to.eql(true)

    expect(
      releaseReserveStub.calledWith({
        currencyId: pair.base.id,
        accountId: sellOrder.accountId,
        amount: sellOrder.amount,
        sourceEventId: sellOrder.id!,
        sourceEventType: SourceEventType.orderCancellation,
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
