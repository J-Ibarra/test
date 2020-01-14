import { Order, OrderDirection, OrderModuleConfig, OrderModuleState } from '@abx-types/order'
import { getAggregateDepth } from '@abx-utils/in-memory-depth-cache'

export const createDepthNotifier = (
  configuration: OrderModuleConfig,
  state: OrderModuleState,
  symbolId: string,
  direction: OrderDirection,
  updatedDepth: Record<OrderDirection, Order[]>,
  topOfDepthUpdated: boolean,
) => {
  const depth = state.depth
  if (depth.muted) {
    return
  }

  if (direction === OrderDirection.sell) {
    const topOfBidDepth =
      updatedDepth[OrderDirection.buy] && updatedDepth[OrderDirection.buy].length > 0 ? updatedDepth[OrderDirection.buy][0] : undefined
    configuration.broadcastAskDepthUpdated({
      symbolId,
      topOfDepthUpdated,
      aggregateDepth: getAggregateDepth(updatedDepth[OrderDirection.sell]),
      oppositeDepthTopOrder: !!topOfBidDepth && ({ amount: topOfBidDepth.amount, price: topOfBidDepth.limitPrice } as any),
      ordersFromDepth: updatedDepth[OrderDirection.sell],
    })
  } else {
    const topOfAskDepth =
      updatedDepth[OrderDirection.sell] && updatedDepth[OrderDirection.sell].length > 0 ? updatedDepth[OrderDirection.sell][0] : undefined

    configuration.broadcastBidDepthUpdated({
      symbolId,
      topOfDepthUpdated,
      aggregateDepth: getAggregateDepth(updatedDepth[OrderDirection.buy]),
      oppositeDepthTopOrder: !!topOfAskDepth && ({ amount: topOfAskDepth.amount, price: topOfAskDepth.limitPrice } as any),
      ordersFromDepth: updatedDepth[OrderDirection.buy],
    })
  }
}
