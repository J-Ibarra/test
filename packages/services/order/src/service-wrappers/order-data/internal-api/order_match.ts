import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { OrderDataEndpoints, findOrderMatch } from '@abx-service-clients/order'
import { findOrderMatchTransaction, findOrderMatchTransactions } from '../../../core'

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    OrderDataEndpoints.findOrderMatch,
    messageFactory(findOrderMatch, queries => findOrderMatchTransaction({ where: queries })),
  )

  epicurus.server(
    OrderDataEndpoints.findOrderMatches,
    messageFactory(findOrderMatch, queries => findOrderMatchTransactions({ where: queries })),
  )

  epicurus.server(
    OrderDataEndpoints.findLastOrderMatchForSymbol,
    messageFactory(findOrderMatch, ({ symbolId }) => findOrderMatchTransactions({ where: { symbolId }, order: [['createdAt', 'DESC']], limit: 1 })),
  )

  epicurus.server(
    OrderDataEndpoints.findLastOrderMatchForSymbols,
    messageFactory(findOrderMatch, ({ symbolIds }) =>
      findOrderMatchTransactions({ where: { symbolId: { $in: symbolIds } }, order: [['createdAt', 'DESC']], limit: 1 }),
    ),
  )
}
