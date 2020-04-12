import { flatMap } from 'lodash'
import moment from 'moment'
import { getCacheClient } from '@abx-utils/db-connection-utils'
import { Order, OrderDirection, OrderValidity, SymbolDepth } from '@abx-types/order'
import { OrderCancellationGateway } from './order_cancellation_gateway'
import { getAllSymbolPairSummaries } from '@abx-service-clients/reference-data'
import { SymbolPairStateFilter } from '@abx-types/reference-data'

const orderCancellationGateway = OrderCancellationGateway.getInstance()

export async function expireOrders(): Promise<any> {
  const allSymbols = await getAllSymbolPairSummaries(SymbolPairStateFilter.all)
  const symbolDepths = await redisDepth(allSymbols.map(({ id }) => id))
  const expiredOrders = getExpiredOrders(symbolDepths)

  return Promise.all(
    expiredOrders.map((order) =>
      orderCancellationGateway.cancelOrder({
        orderId: order.id!,
        cancellationReason: 'Order Expired',
      }),
    ),
  )
}

function redisDepth(symbolsIds: string[]): Promise<SymbolDepth[]> {
  const symbolCacheKeys = symbolsIds.map((symbolId) => `exchange:symbol:depth:${symbolId}`)

  return getCacheClient().getAll<SymbolDepth>(symbolCacheKeys)
}

function getExpiredOrders(symbolDepths: SymbolDepth[]): Order[] {
  const currentTime = new Date()

  return flatMap(symbolDepths, (symbolDepth: SymbolDepth) => {
    if (!symbolDepth) {
      return []
    }

    return (symbolDepth[OrderDirection.buy] || []).concat(symbolDepth[OrderDirection.sell] || [])
  }).filter((order) => {
    return order && order.validity === OrderValidity.GTD && moment(order.expiryDate).isBefore(currentTime)
  })
}
