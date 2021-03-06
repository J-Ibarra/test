import { EpicurusPublicInterface } from 'epicurus-node'

import { ConfigSourceFactory, ExchangeOrderPlacementFacade } from '../../src/shared-components/providers'
import { getEpicurusInstance } from '../../src/shared-components/providers/redis/EpicurusClient'
import { orderId, defaultTestUser } from '../utils/test-data'
import { CurrencyCode, KinesisCryptoCurrency } from '../../src/shared-components/models'

describe('ExchangeOrderPlacementFacade', () => {
  let placeOrderFacade: ExchangeOrderPlacementFacade
  let epicurus: EpicurusPublicInterface

  beforeAll(async () => {
    const config = ConfigSourceFactory.getConfigSourceForEnvironment()
    placeOrderFacade = new ExchangeOrderPlacementFacade()
    epicurus = getEpicurusInstance(config.getRedisConfig())
    epicurus.server('contractExchange:placeOrder', ({  }: any, respond: (err: any, response?: any) => void) => {
      respond(null, { id: orderId })
    })
  })

  afterEach(() => epicurus.shutdown())

  it('should use contractExchange:placeOrder channel to create sell market order', async () => {
    const id = await placeOrderFacade.createSellMarketOrder(defaultTestUser.id, KinesisCryptoCurrency.kag, 100, CurrencyCode.EUR)

    expect(id).toEqual(orderId)
  })
})
