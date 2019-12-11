import { boot as bootstrapOrderEndpoints } from './order'
import { boot as bootstrapOrderMatchEndpoints } from './order_match'

export function bootstrapInternalApi() {
  bootstrapOrderEndpoints()
  bootstrapOrderMatchEndpoints()
}
