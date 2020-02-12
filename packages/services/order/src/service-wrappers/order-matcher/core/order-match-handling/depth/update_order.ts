import { RuntimeError } from '@abx-types/error'
import { DepthState, Order } from '@abx-types/order'
import { removeOrderFromDepth } from './remove_order'

export const updateOrderInDepth = (order: Order, depth: DepthState) => {
  let topOfDepthUpdated: boolean

  if (order.remaining === 0) {
    topOfDepthUpdated = removeOrderFromDepth(order, depth).topOfDepthUpdated
  } else {
    topOfDepthUpdated = updateOrder(order, depth)
  }

  depth.broadcast.depthUpdated(order.symbolId, order.direction, depth.orders[order.symbolId], topOfDepthUpdated)
}

const updateOrder = ({ id, symbolId, direction, remaining }: Order, depth): boolean => {
  const affectedDepth = depth.orders[symbolId][direction]
  const orderToUpdate = affectedDepth.find(depthItem => depthItem.id === id)

  if (!orderToUpdate) {
    throw new RuntimeError(`Unable to find order id ${id} and update it`)
  }

  orderToUpdate.remaining = remaining

  return affectedDepth[0] && affectedDepth[0].id === id
}
