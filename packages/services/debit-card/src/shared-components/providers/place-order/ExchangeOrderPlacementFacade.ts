import { Injectable } from '@nestjs/common'

import { CurrencyCode, KinesisCryptoCurrency } from '../../models'
import { placeOrder } from '@abx-service-clients/order'
import { OrderDirection, OrderType, OrderValidity } from '@abx-types/order'

@Injectable()
export class ExchangeOrderPlacementFacade {
  public async createSellMarketOrder(
    accountId: string,
    soldCurrency: KinesisCryptoCurrency,
    amount: number,
    receivedCurrency: CurrencyCode,
  ): Promise<number> {
    const order = await placeOrder({
      accountId,
      symbolId: `${soldCurrency}_${receivedCurrency}`,
      direction: OrderDirection.sell,
      amount,
      orderType: OrderType.market,
      validity: OrderValidity.GTD,
    })

    return order.id!
  }
}
