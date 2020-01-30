import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { OrderDataEndpoints, findOrderMatch } from '@abx-service-clients/order'
import { findOrderMatchTransaction, findOrderMatchTransactions, findTradeTransaction } from '../../../core'
import { findOrderMatchSchema, findLastOrderMatchForSymbolSchema, findLastOrderMatchForSymbolsSchema, findTradeTransactionSchema } from './schemas'

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    OrderDataEndpoints.findOrderMatch,
    messageFactory(findOrderMatchSchema, queries => findOrderMatchTransaction({ where: queries })),
  )

  epicurus.server(
    OrderDataEndpoints.findOrderMatches,
    messageFactory(findOrderMatch, queries => findOrderMatchTransactions({ where: queries })),
  )

  epicurus.server(
    OrderDataEndpoints.findLastOrderMatchForSymbol,
    messageFactory(findLastOrderMatchForSymbolSchema, ({ symbolId }) =>
      findOrderMatchTransactions({ where: { symbolId }, order: [['createdAt', 'DESC']], limit: 1 }),
    ),
  )

  epicurus.server(
    OrderDataEndpoints.findLastOrderMatchForSymbols,
    messageFactory(findLastOrderMatchForSymbolsSchema, ({ symbolIds }) =>
      findOrderMatchTransactions({ where: { symbolId: { $in: symbolIds } }, order: [['createdAt', 'DESC']], limit: 1 }),
    ),
  )

  epicurus.server(
    OrderDataEndpoints.findTradeTransaction,
    messageFactory(findTradeTransactionSchema, ({ id }) => findTradeTransaction({ where: { id } })),
  )
}
