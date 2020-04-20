import {
  findOrder,
  getOpenOrders,
  findOrderMatchTransaction,
  findOrderMatchTransactions,
  findTradeTransaction,
  findLastOrderMatchForSymbol,
  generateReportForTradeTransaction,
  findLastOrderMatchForSymbols,
} from '../../../core'
import { OrderDataEndpoints } from '@abx-service-clients/order'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createOrderQueryEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: OrderDataEndpoints.findOrderById,
      handler: ({ orderId }) => findOrder(orderId),
    },
    {
      path: OrderDataEndpoints.getOpenOrders,
      handler: ({ symbolId, orderDirection, limit }) => getOpenOrders(symbolId, orderDirection, limit),
    },
    {
      path: OrderDataEndpoints.findOrderMatch,
      handler: async (queries) => {
        const orderMatches = await findOrderMatchTransaction(queries)

        return orderMatches[0]
      },
    },
    {
      path: OrderDataEndpoints.findOrderMatches,
      handler: (queries) => findOrderMatchTransactions(queries),
    },
    {
      path: OrderDataEndpoints.findLastOrderMatchForSymbol,
      handler: ({ symbolId }) => findLastOrderMatchForSymbol(symbolId),
    },
    {
      path: OrderDataEndpoints.findLastOrderMatchForSymbols,
      handler: ({ symbolIds }) => findLastOrderMatchForSymbols(symbolIds),
    },
    {
      path: OrderDataEndpoints.findTradeTransaction,
      handler: ({ id }) => findTradeTransaction({ where: { id } }),
    },
    {
      path: OrderDataEndpoints.generateTradeTransactionReportData,
      handler: ({ tradeTransactionId }) => generateReportForTradeTransaction(tradeTransactionId),
    },
  ]
}
