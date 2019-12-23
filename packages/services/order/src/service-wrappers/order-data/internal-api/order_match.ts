import { getEpicurusInstance, messageFactory } from '@abx/db-connection-utils'
import { OrderMatchEndpoints, findOrderMatch } from '@abx-service-clients/order'
import { findOrderMatchTransaction, findOrderMatchTransactions } from '../../../core'

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    OrderMatchEndpoints.findOrderMatch,
    messageFactory(findOrderMatch, queries => findOrderMatchTransaction({ where: queries })),
  )

  epicurus.server(
    OrderMatchEndpoints.findOrderMatches,
    messageFactory(findOrderMatch, queries => findOrderMatchTransactions({ where: queries })),
  )
}
