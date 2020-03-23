import { SymbolEndpoints } from '@abx-service-clients/reference-data'
import { getAllCompleteSymbolDetails } from '../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'
import { SymbolPair, SymbolPairStateFilter } from '@abx-types/reference-data'

export function createSymbolEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: SymbolEndpoints.getAllCompleteSymbolDetails,
      handler: ({ state }) => getAllCompleteSymbolDetails({ state }),
    } as InternalRoute<{ state: SymbolPairStateFilter }, SymbolPair[]>,
  ]
}
