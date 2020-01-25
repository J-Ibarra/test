import { WalletSymbols, FiatCurrency } from '@abx-types/reference-data'
import { calculateRealTimeMidPriceForSymbols } from '@abx-service-clients/market-data'

/**
 * Converts the real time midprices stored in a Map to an object, and sends the midprices in the response to the client.
 */
export async function convertRealTimeMidPriceForSymbolsToObject(): Promise<Record<string, number>> {
  const realTimeMidPrices: Record<string, number> = {}
  const realTimeMidPricesMap = await calculateRealTimeMidPriceForSymbols(Object.values(WalletSymbols))

  realTimeMidPricesMap.forEach((midPrice, symbolId) => {
    const walletCurrency = symbolId.replace(`_${FiatCurrency.usd}`, '')
    realTimeMidPrices[walletCurrency] = midPrice
  })

  return realTimeMidPrices
}
