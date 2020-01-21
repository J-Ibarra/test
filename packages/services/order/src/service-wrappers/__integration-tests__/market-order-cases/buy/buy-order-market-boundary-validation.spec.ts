import {
  placeBuyLimitOrder,
  placeSellMarketOrder,
  verifyFeeAddedToOperatorAccount,
  waitForOrderToAppearInBuyDepth,
  KVT,
  ETH,
  createTestTradingAccounts,
  stubBalanceReserveAdjustmentCalls,
} from '../../utils'
import { setUp } from '../../utils/setup.utils'

describe('Market Orders: Buy', async () => {
  let pair
  const customFeeRate = 0.0022
  let updateAvailable: sinon.SinonStub

  beforeEach(async function() {
    const { symbol, updateAvailableStub } = await setUp({
      baseCurrency: KVT,
      quoteCurrency: ETH,
      feeCurrency: ETH,
      customFeeRate,
    })
    pair = symbol
    updateAvailable = updateAvailableStub
  })

  it('Market Order - boundary validation orderConsideration correctly computed', async function() {
    const [{ accountId: buyerId }, { accountId: seller1Id }] = await createTestTradingAccounts(4)

    const { id: buyOrderId } = await placeBuyLimitOrder({ amount: 1, limitPrice: 0.5, buyerAccountId: buyerId, pair })
    await waitForOrderToAppearInBuyDepth(pair, buyOrderId!)

    stubBalanceReserveAdjustmentCalls([{ orderId: buyOrderId!, accountId: buyerId, currencyCode: ETH.currency, expectedInitialReserve: 1 }])

    await placeSellMarketOrder({ amount: 1, sellerAccountId: seller1Id, pair, waitForSettlement: true })

    await verifyFeeAddedToOperatorAccount(updateAvailable, 0.0022, pair.fee.id)
  }).timeout(60_000)
})
