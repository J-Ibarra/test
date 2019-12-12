import Decimal from 'decimal.js'

import { Environment } from '@abx-types/config'
import { Logger } from '@abx/logging'
import { SupportedFxPair } from '@abx-types/order'
import { sourceFxRateFromExchangeRatesApi } from './exchangeratesapi_fx_rate_source'
import { sourceFxRateFromCache, updateCachedRateForSymbol } from './fx_rate_cache'
import { FxPriceSourceResponse } from './fx_source_response'
import { sourceFxRateFromXignite } from './xignite_fx_rate_source'

const logger = Logger.getInstance('lib', 'fx_rate_provider')

type FxPriceProviderFunction = (fx: SupportedFxPair) => Promise<FxPriceSourceResponse>

const TEST_RATE = 1
const fxRateProviderPipe: FxPriceProviderFunction[] = [sourceFxRateFromXignite, sourceFxRateFromExchangeRatesApi, sourceFxRateFromCache]

export async function getQuoteFor(fxPair: SupportedFxPair, fxProviders = fxRateProviderPipe): Promise<Decimal> {
  // We pass in test fx providers in our unit tests
  if (process.env.NODE_ENV !== Environment.test || fxProviders !== fxRateProviderPipe) {
    for (const fxRateProvider of fxProviders) {
      const priceResponse = await fxRateProvider(fxPair)

      if (priceResponse.success) {
        await updateCachedRateForSymbol(fxPair, priceResponse)
        return new Decimal(priceResponse.price)
      } else {
        logger.error(priceResponse.error)
      }
    }

    return new Decimal(0)
  }

  return new Decimal(TEST_RATE)
}
