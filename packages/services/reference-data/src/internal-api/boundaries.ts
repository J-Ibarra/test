import { BoundaryEndpoints } from '@abx-service-clients/reference-data'
import { findSymbolBoundaries, findBoundaryForCurrency, findAllBoundaries, findAllCurrencyCodes, findBoundariesForAll } from '../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createBoundaryEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: BoundaryEndpoints.findBoundaryForCurrency,
      handler: ({ currency }) => findBoundaryForCurrency(currency),
    },
    {
      path: BoundaryEndpoints.getAllCurrencyBoundaries,
      handler: async () => {
        const allCurrencies = await findAllCurrencyCodes()

        return findAllBoundaries(allCurrencies)
      },
    },
    {
      path: BoundaryEndpoints.getBoundariesForCurrencies,
      handler: ({ currencies }) => findBoundariesForAll(currencies),
    },
    {
      path: BoundaryEndpoints.getSymbolBoundaries,
      handler: ({ symbolId }) => findSymbolBoundaries(symbolId),
    },
  ]
}
