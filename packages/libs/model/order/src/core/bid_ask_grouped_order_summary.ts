import { OrderSummary } from './order_summary'

export interface BidAskGroupedOrderSummary {
  bid: OrderSummary[]
  ask: OrderSummary[]
}
