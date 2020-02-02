import { SymbolEndpoints } from '@abx-service-clients/reference-data'
import { getAllCompleteSymbolDetails } from '../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createSymbolEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: SymbolEndpoints.getAllCompleteSymbolDetails,
      handler: () => getAllCompleteSymbolDetails(),
    },
  ]
}
