import { Injectable, Inject } from '@nestjs/common'

import { CONFIG_SOURCE_TOKEN, ConfigSource } from '../config'
import { getEpicurusInstance } from '../redis/EpicurusClient'
import { CurrencyCode, KinesisCryptoCurrency } from '../../../../src/shared-components/models'
import { PlacedOrderResponse } from './PlacedOrderResponse.model'

const exchangePlaceOrderChannel = 'contractExchange:placeOrder'

@Injectable()
export class ExchangePlaceOrderFacade {
  constructor(@Inject(CONFIG_SOURCE_TOKEN) private configSource: ConfigSource) {}

  public async createSellMarketOrder(
    accountId: string,
    soldCurrency: KinesisCryptoCurrency,
    amount: number,
    receivedCurrency: CurrencyCode,
  ): Promise<number> {
    const epicurus = getEpicurusInstance(this.configSource.getRedisConfig())

    const placedOrderResponse: PlacedOrderResponse = await epicurus.request(exchangePlaceOrderChannel, {
      accountId,
      symbolId: `${soldCurrency}_${receivedCurrency}`,
      direction: 'sell',
      amount,
      orderType: 'market',
      validity: 'GTD',
    })

    return placedOrderResponse.id
  }
}
