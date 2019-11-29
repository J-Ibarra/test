import { OrderDirection } from '../core/order_direction.enum'
import { Order } from '../core/order'

export type SymbolDepth = Record<OrderDirection, Order[]>
