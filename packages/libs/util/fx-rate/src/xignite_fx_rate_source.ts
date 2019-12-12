import axios from 'axios'

import { Logger } from '@abx/logging'
import { SupportedFxPair } from '@abx-types/order'
import { errorFxRateResponse, FxPriceSourceResponse, successFxRateResponse } from './fx_source_response'

const logger = Logger.getInstance('lib', 'xignite_fx_rate_source')
export const authToken = process.env.FX_RATE_XIGNITE_TOKEN || ''

interface XigniteFxRateResponse {
  Bid: number
  Ask: number
  Mid: number
  Message: string
}

export async function sourceFxRateFromXignite(fxPair: SupportedFxPair): Promise<FxPriceSourceResponse> {
  try {
    const latestFxRate = await axios.get<XigniteFxRateResponse>('https://globalcurrencies.xignite.com/xGlobalCurrencies.json/GetRealTimeRate', {
      params: {
        Symbol: fxPair.replace('_', ''),
        _token: authToken,
      },
      timeout: 10_000,
    })

    logger.debug(`Successfully retrieved ${fxPair} rate from Xignite`)

    if (!latestFxRate.data.Ask) {
      return errorFxRateResponse(latestFxRate.data.Message)
    }

    return successFxRateResponse(latestFxRate.data.Ask)
  } catch (e) {
    return errorFxRateResponse(e.message)
  }
}
