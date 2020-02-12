import { HandlerState, Order, UsdMidPriceEnrichedOrderMatch } from '@abx-types/order'

export function broadcastUpdates(orderUpdates: Order[], orderMatches: UsdMidPriceEnrichedOrderMatch[], handler: HandlerState) {
  orderUpdates.forEach(order => handler.broadcast!.orderUpdated(order))
  orderMatches.forEach(handler.broadcast!.orderMatched)
}
