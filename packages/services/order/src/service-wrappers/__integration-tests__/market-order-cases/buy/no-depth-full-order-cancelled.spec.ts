import { createTestTradingAccounts, stubBalanceReserveAdjustmentCalls, KAU, USD, placeBuyMarketOrder, waitToBeCancelled } from '../../utils'
import { setUp } from '../../utils/setup.utils'

describe('Market Orders: Buy', async () => {
  let pair

  beforeEach(async function() {
    const { symbol } = await setUp({
      baseCurrency: KAU,
      quoteCurrency: USD,
      feeCurrency: KAU,
    })
    pair = symbol
  })

  it('Market Order - Cancelled (No Depth) - BUY (fees in base)', async () => {
    const [{ accountId: buyerId }] = await createTestTradingAccounts(4)

    const buyMarketOrder = await placeBuyMarketOrder({
      amount: 20,
      buyerAccountId: buyerId,
      pair,
    })

    stubBalanceReserveAdjustmentCalls([{ orderId: buyMarketOrder.id!, accountId: buyerId, currencyCode: USD.currency, expectedInitialReserve: 0 }])

    await waitToBeCancelled(buyMarketOrder.id!)
  }).timeout(60_000)
})
