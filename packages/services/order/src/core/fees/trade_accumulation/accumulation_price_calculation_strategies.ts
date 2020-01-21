import Decimal from 'decimal.js'
import { get } from 'lodash'
import { Transaction } from 'sequelize'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { CurrencyCode, SymbolPair, currencyScale } from '@abx-types/reference-data'
import { findLastOrderMatchForSymbol } from '../../transaction'

/** Responsible for creating {@link TradeAccumulationStrategy} instances based on the currency pair. */
export class TradeAccumulationStrategyFactory {
  public getTradeAccumulationStrategy({ quote }: SymbolPair): TradeAccumulationStrategy {
    if (quote.code === CurrencyCode.usd) {
      return new QuoteCurrencyUsdStrategy()
    }

    return new NonUsdPairStrategy()
  }
}

export interface TradeAccumulationStrategy {
  calculateUsdTradePrice(symbol: SymbolPair, amount: number, price: number, t?: Transaction): Promise<number>
}

/**
 * A simple strategy for calculating the USD value of a trade where USD is the quote currency.
 * E.g. USD/KVT
 * price - 5 USD
 * amount - 2 KVT
 * Total: 10
 */
export class QuoteCurrencyUsdStrategy implements TradeAccumulationStrategy {
  public calculateUsdTradePrice(_: SymbolPair, amount: number, price: number): Promise<number> {
    return Promise.resolve(parseFloat(new Decimal(amount).times(price).toFixed(currencyScale)))
  }
}

/** Handles the tricky scenario where USD is not included in the pair e.g KAU/ETH. */
export class NonUsdPairStrategy implements TradeAccumulationStrategy {
  /**
   * Handles the scenario where the traded pair does not include USD e.g. KAU/ETH.
   * 1.In such scenarios we want to retrieve the {base}/USD pair (the 'base' of the trade pair) pair.
   * 2.For that pair {base}/USD we get the latest mid price, if one could not be found we get the latest match price.
   * 3.That will give us the amount of USD we need to pay for a single {base} currency.
   * 4.That price is the used to compute the USD trade amount for the current trade -  amount(amount of base currency) * the price from 3
   *
   * Example: for a KAU/ETH order with price 6ETH and amount 5KAU (total price 30KAU)
   * 1. We get the KAU/USD symbol
   * 2. We get the latest mid price for KAU/USD , lets say this is 4 i.e. 4 dollars to buy 1 KAU
   * 3. The trade USD total is computed =  5(the base amount, 5KAU) * 4(latest USD price of 1KAU) =  20
   *
   * @param param the traded currency pair
   * @param amount the traded amount
   */
  public async calculateUsdTradePrice({ base }: SymbolPair, amount: number): Promise<number> {
    const dollarsForBaseCurrency = await this.findLatestPriceForUsdAndToPair(`${base.code}_${CurrencyCode.usd}`)

    return parseFloat(new Decimal(amount).times(dollarsForBaseCurrency).toFixed(currencyScale))
  }

  // Retrieves the latest mid price for the given symbol
  // If no mid-price present, latest order match price is used
  private async findLatestPriceForUsdAndToPair(symbolId: string) {
    const midPrice = await calculateRealTimeMidPriceForSymbol(symbolId)

    if (!!midPrice) {
      return midPrice
    }

    const latestOrderMatch = await findLastOrderMatchForSymbol(symbolId)

    return get(latestOrderMatch, 'matchPrice', 1)
  }
}
