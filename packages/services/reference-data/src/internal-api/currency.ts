import { CurrencyEndpoints } from '@abx-service-clients/reference-data'
import { findAllCurrencies, getCurrencyCode, findCurrencyForCode } from '../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createCurrencyEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: CurrencyEndpoints.getAllCurrencies,
      handler: () => findAllCurrencies(),
    },
    {
      path: CurrencyEndpoints.getCurrencyCode,
      handler: ({ currencyId }) => getCurrencyCode(currencyId),
    },
    {
      path: CurrencyEndpoints.findCurrencyForCode,
      handler: ({ currencyCode }) => findCurrencyForCode(currencyCode),
    },
  ]
}
