import { OrderMatch } from './order_match'

export interface UsdMidPriceEnrichedOrderMatch extends OrderMatch {
  feeCurrencyToUsdMidPrice: number
}
