import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { SymbolEndpoints } from '@abx-service-clients/reference-data'
import { emptyPayload } from './schemas'
import { getAllCompleteSymbolDetails } from '../core'

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    SymbolEndpoints.getAllCompleteSymbolDetails,
    messageFactory(emptyPayload, () => getAllCompleteSymbolDetails()),
  )
}
