import { expect } from 'chai'
import moment from 'moment'
import { getEpicurusInstance, truncateTables, getCacheClient } from '@abx/db-connection-utils'
import { MidPricesForSymbolRequest } from '@abx-types/market-data'
import { CacheFirstMidPriceRepository } from '../../core'
import { OrderPubSubChannels } from '@abx-service-clients/order'
import sinon from 'sinon'

const symbolId = 'KAU_USD'

describe('market_data_reconciliation:midPriceChange', () => {
  beforeEach(async () => {
    await truncateTables()
    await getCacheClient().flush()
    sinon.restore()
  })

  it('should not trigger mid price change when top of depth not changed', async () => {
    const epicurus = getEpicurusInstance()
    await epicurus.publish(OrderPubSubChannels.askDepthUpdated, {
      topOfDepthUpdated: false,
      symbolId: 'KAU_KAG',
      aggregateDepth: [
        {
          price: 12,
          amount: 5,
        },
      ],
      oppositeDepthTopOrder: {
        price: 10,
        amount: 6,
      },
    })

    const midPriceUpdated = await waitUntilMidPriceRecordedForSymbol()
    expect(midPriceUpdated).to.eql(false)
  })

  it('should not trigger mid price change when order book empty', async () => {
    const epicurus = getEpicurusInstance()
    await epicurus.publish(OrderPubSubChannels.askDepthUpdated, {
      topOfDepthUpdated: false,
      symbolId: 'KAU_KAG',
      aggregateDepth: [],
      oppositeDepthTopOrder: undefined,
    })

    const midPriceUpdated = await waitUntilMidPriceRecordedForSymbol()
    expect(midPriceUpdated).to.eql(false)
  })
})

async function waitUntilMidPriceRecordedForSymbol(counter = 0): Promise<any> {
  if (counter === 5) {
    return Promise.resolve(false)
  }
  await new Promise(res => setTimeout(res, 200))

  const midPricesForSymbol = await CacheFirstMidPriceRepository.getInstance().getMidPricesForSymbol(
    new MidPricesForSymbolRequest(
      symbolId,
      moment()
        .subtract(1, 'hours')
        .toDate(),
    ),
  )

  return midPricesForSymbol && midPricesForSymbol.length === 0 ? waitUntilMidPriceRecordedForSymbol(counter + 1) : midPricesForSymbol[0]
}
