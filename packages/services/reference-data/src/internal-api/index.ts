import { boot as bootstrapSymbolEndpoints } from './symbols'
import { boot as bootstrapCurrencyEndpoints } from './currency'
import { boot as bootstrapBoundaryEndpoints } from './boundaries'
import { boot as bootstrapConfigEndpoints } from './config'

export function bootstrapInternalApi() {
  bootstrapSymbolEndpoints()
  bootstrapCurrencyEndpoints()
  bootstrapBoundaryEndpoints()
  bootstrapConfigEndpoints()
}
