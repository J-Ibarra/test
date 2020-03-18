import { CurrencyCode, KinesisCryptoCurrency } from '../../../../src/shared-components/models'

export const PLACE_ORDER_FACADE_TOKEN = 'place_order_reserve_facade'

export interface PlaceOrderFacade {
  createSellMarketOrder(
    accountId: string,
    soldCurrency: KinesisCryptoCurrency,
    amount: number,
    receivedCurrency: CurrencyCode,
  ): Promise<number>
}
