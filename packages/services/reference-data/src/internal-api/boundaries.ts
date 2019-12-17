import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { BoundaryEndpoints } from '@abx-service-clients/reference-data'
import { emptyPayload, findBoundaryForCurrency as findBoundaryForCurrencySchema } from './schemas'
import { findBoundaryForCurrency, findAllBoundaries, findAllCurrencyCodes } from '../core'

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
}
