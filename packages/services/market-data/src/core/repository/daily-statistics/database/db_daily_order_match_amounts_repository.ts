import { OrderMatch, OrderMatchStatus } from '../../../../../orders/interface'
import { findOrderMatchTransactions } from '../../../../../transactions/lib/find_order_match_transaction'
import { reduceSymbolsToMappedObject } from '../../utils/helpers'

export const findOrderMatchTransactionsForSymbols = async (symbolIds: string[], timeFilter: Date): Promise<Map<string, OrderMatch[]>> => {
  const orderMatchTransactions = await findOrderMatchTransactions({
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
