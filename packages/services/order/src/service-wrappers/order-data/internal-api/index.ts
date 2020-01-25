import { boot as bootstrapOrderEndpoints } from './order'
import { boot as bootstrapSettlementEndpoints } from './order_match'

export function bootstrapInternalApi() {
  bootstrapOrderEndpoints()
  bootstrapSettlementEndpoints()
}
