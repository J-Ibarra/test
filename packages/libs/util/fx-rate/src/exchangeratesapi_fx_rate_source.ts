import axios from 'axios'

import { Logger } from '@abx/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { SupportedFxPair } from '@abx-types/order'
import { errorFxRateResponse, FxPriceSourceResponse, successFxRateResponse } from './fx_source_response'

const logger = Logger.getInstance('lib', 'exchangeratesapi_fx_rate_source')

interface ExchangeRatesApiResponse {
  rates: Record<CurrencyCode, number>
}

export async function sourceFxRateFromExchangeRatesApi(fxPair: SupportedFxPair): Promise<FxPriceSourceResponse> {
  try {
    const [base, quote] = fxPair.split('_')
    const latestFxRateForBase = await axios.get<ExchangeRatesApiResponse>('https://api.exchangeratesapi.io/latest', {
      params: {
        base,
      },
      timeout: 10_000,
    })

    logger.debug(`Successfully retrieved ${fxPair} rate from ExchangeRatesApi`)

    const quoteRate = latestFxRateForBase.data.rates[quote]
    return successFxRateResponse(quoteRate)
  } catch (e) {
    return errorFxRateResponse(e.message)
  }
}
