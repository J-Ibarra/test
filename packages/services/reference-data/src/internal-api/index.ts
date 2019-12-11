import { boot as bootstrapSymbolEndpoints } from './symbols'
import { boot as bootstrapCurrencyEndpoints } from './currency'

export function bootstrapInternalApi() {
  bootstrapSymbolEndpoints()
  bootstrapCurrencyEndpoints()
}
