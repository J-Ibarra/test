import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { BoundaryEndpoints, getSymbolBoundaries } from '@abx-service-clients/reference-data'
import {
  emptyPayload,
  findBoundaryForCurrency as findBoundaryForCurrencySchema,
  getBoundariesForCurrenciesSchema,
  getSymbolBoundariesSchema,
} from './schemas'
import { findBoundaryForCurrency, findAllBoundaries, findAllCurrencyCodes, findBoundariesForAll } from '../core'

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    BoundaryEndpoints.findBoundaryForCurrency,
    messageFactory(findBoundaryForCurrencySchema, ({ currency }) => findBoundaryForCurrency(currency)),
  )

  epicurus.server(
    BoundaryEndpoints.getAllCurrencyBoundaries,
    messageFactory(emptyPayload, async () => {
      const allCurrencies = await findAllCurrencyCodes()

      findAllBoundaries(allCurrencies)
    }),
  )

  epicurus.server(
    BoundaryEndpoints.getBoundariesForCurrencies,
    messageFactory(getBoundariesForCurrenciesSchema, ({ currencies }) => findBoundariesForAll(currencies)),
  )

  epicurus.server(
    BoundaryEndpoints.getSymbolBoundaries,
    messageFactory(getSymbolBoundariesSchema, ({ symbolId }) => getSymbolBoundaries(symbolId)),
  )
}
