import { Logger } from '@abx-utils/logging'
import { getCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { Order, OrderDirection } from '@abx-types/order'
import { releaseRemainingReserveForBuyOrder } from './buy_reserve_release_handler'
import { releaseRemainingReserveForSellOrder } from './sell_reserve_release_handler'
import { SymbolPairStateFilter } from '@abx-types/reference-data'

const logger = Logger.getInstance('lib', 'releaseRemainingReserveForCancelledOrder')

export async function releaseRemainingReserveForCancelledOrder(order: Order) {
  const symbol = await getCompleteSymbolDetails(order.symbolId, SymbolPairStateFilter.all)

  if (order.direction === OrderDirection.sell) {
    await releaseRemainingReserveForSellOrder(symbol, order)
    logger.debug(`Released reserve for cancelled sell order ${order.id}`)
  } else if (order.direction === OrderDirection.buy) {
    await releaseRemainingReserveForBuyOrder(symbol, order)
    logger.debug(`Released reserve for cancelled buy order ${order.id}`)
  }
}
