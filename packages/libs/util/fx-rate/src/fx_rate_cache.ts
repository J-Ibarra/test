import { getCacheClient } from '@abx-utils/db-connection-utils'
import { SupportedFxPair } from '@abx-types/order'
import { errorFxRateResponse, FxPriceSourceResponse, successFxRateResponse } from './fx_source_response'

const FX_RATE_CACHE_KEY = 'exchange:fx-rates:'

const redisClient = getCacheClient()

export async function sourceFxRateFromCache(fxPair: SupportedFxPair, cacheClient = redisClient): Promise<FxPriceSourceResponse> {
  const latestCachedRateForPair = await cacheClient.get<number>(`${FX_RATE_CACHE_KEY}${fxPair}`)

  if (!latestCachedRateForPair || latestCachedRateForPair === 0) {
    return errorFxRateResponse(`No fx rate for ${fxPair} previously recorded`)
  }

  return successFxRateResponse(latestCachedRateForPair, false)
}

export async function updateCachedRateForSymbol(
  fxPair: SupportedFxPair,
  { cacheRate, price }: FxPriceSourceResponse,
  cacheClient = redisClient,
): Promise<void> {
  if (cacheRate) {
    await cacheClient.set(`${FX_RATE_CACHE_KEY}${fxPair}`, price)
  }
}
