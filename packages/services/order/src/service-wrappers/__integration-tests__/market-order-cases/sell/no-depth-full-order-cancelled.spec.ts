import { placeSellMarketOrder, KAU, USD, stubBalanceReserveAdjustmentCalls, waitToBeCancelled, createTestTradingAccounts } from '../../utils'
import { setUp, DEFAULT_TEST_FEE_RATE } from '../../utils/setup.utils'
import Decimal from 'decimal.js'

describe('Market Order:Sell', async () => {
  let pair

  beforeEach(async function() {
    const { symbol } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
  })

  it('Market Order - Cancelled (No Depth) - SELL (fees in base)', async () => {
    const [{ accountId: sellerId }] = await createTestTradingAccounts(4)

    const sellOrder = await placeSellMarketOrder({
      amount: 10,
      sellerAccountId: sellerId,
      pair,
    })
    stubBalanceReserveAdjustmentCalls([
      {
        orderId: sellOrder.id!,
        accountId: sellOrder.accountId,
        currencyCode: KAU.currency,
        expectedInitialReserve: new Decimal(10)
          .times(1 - DEFAULT_TEST_FEE_RATE)
          .toDP(KAU.boundary?.maxDecimals!, Decimal.ROUND_DOWN)
          .toNumber(),
      },
    ])

    await waitToBeCancelled(sellOrder.id!)
  }).timeout(60_000)
})
