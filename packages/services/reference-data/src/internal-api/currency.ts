import { CurrencyEndpoints } from '@abx-service-clients/reference-data'
import { fetchAllCurrencies, getCurrencyCode, findCurrencyForCode, findCurrenciesByAccountId } from '../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createCurrencyEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: CurrencyEndpoints.getAllCurrencies,
      handler: () => fetchAllCurrencies(),
    },
    {
      path: CurrencyEndpoints.getCurrencyCode,
      handler: ({ currencyId, state }) => getCurrencyCode(currencyId, state),
    },
    {
      path: CurrencyEndpoints.findCurrencyForCode,
      handler: ({ currencyCode, state }) => findCurrencyForCode(currencyCode, state),
    },
    {
      path: CurrencyEndpoints.getAllCurrenciesEligibleForAccount,
      handler: ({ accountId }) => findCurrenciesByAccountId(accountId),
    },
  ]
}
