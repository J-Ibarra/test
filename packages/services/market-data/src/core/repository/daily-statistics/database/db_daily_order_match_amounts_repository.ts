import { OrderMatch, OrderMatchStatus } from '@abx-types/order'
import { findOrderMatches } from '@abx-service-clients/order'
import { reduceSymbolsToMappedObject } from '../../utils/helpers'

export const findOrderMatchTransactionsForSymbols = async (symbolIds: string[], timeFilter: Date): Promise<Map<string, OrderMatch[]>> => {
  const orderMatchTransactions = await findOrderMatches({
    where: {
      symbolId: {
        $in: symbolIds,
      },
      createdAt: {
        $gte: timeFilter,
      },
      status: OrderMatchStatus.settled,
    },
    order: ['symbolId'],
  })
  return reduceSymbolsToMappedObject(orderMatchTransactions)
}
