import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { CurrencyEndpoints } from '@abx-service-clients/reference-data'
import { emptyPayload } from './schemas'
import { findAllCurrencies } from '../core'

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    CurrencyEndpoints.getAllCurrencies,
    messageFactory(emptyPayload, () => findAllCurrencies()),
  )
}
