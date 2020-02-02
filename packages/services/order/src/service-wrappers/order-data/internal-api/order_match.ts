import { OrderDataEndpoints } from '@abx-service-clients/order'
import { findOrderMatchTransaction, findOrderMatchTransactions, findTradeTransaction } from '../../../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createOrderMatchQueryEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: OrderDataEndpoints.findOrderMatch,
      handler: queries => findOrderMatchTransaction(queries),
    },
    {
      path: OrderDataEndpoints.findOrderMatches,
      handler: queries => findOrderMatchTransactions(queries),
    },
    {
      path: OrderDataEndpoints.findLastOrderMatchForSymbol,
      handler: ({ symbolId }) => findOrderMatchTransactions({ where: { symbolId }, order: [['createdAt', 'DESC']], limit: 1 }),
    },
    {
      path: OrderDataEndpoints.findLastOrderMatchForSymbols,
      handler: ({ symbolIds }) => findOrderMatchTransactions({ where: { symbolId: { $in: symbolIds } }, order: [['createdAt', 'DESC']], limit: 1 }),
    },
    {
      path: OrderDataEndpoints.findTradeTransaction,
      handler: ({ id }) => findTradeTransaction({ where: { id } }),
    },
  ]
}
