import { boot as bootstrapSymbolEndpoints } from './symbols'
import { boot as bootstrapCurrencyEndpoints } from './currency'
import { boot as bootstrapBoundaryEndpoints } from './boundaries'

export function bootstrapInternalApi() {
  bootstrapSymbolEndpoints()
  bootstrapCurrencyEndpoints()
  bootstrapBoundaryEndpoints()
}
