import { CurrencyEndpoints } from '@abx-service-clients/reference-data'
import { findAllCurrencies } from '../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createCurrencyEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: CurrencyEndpoints.getAllCurrencies,
      handler: () => findAllCurrencies(),
    },
  ]
}
