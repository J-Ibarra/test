import { BalanceType } from '@abx-types/balance'
import { Order } from '@abx-types/order'
import { SymbolPair } from '@abx-types/reference-data'
import { findTradeTransactions } from '../../../../core'
import { findRawBalances, getBalanceAdjustmentsForBalanceAndTradeTransactions } from '@abx-service-clients/balance'

export async function retrieveTotalReleasedAmountForOrder({ id: orderId, accountId }: Order, { quote }: SymbolPair): Promise<number> {
  const rawBalances = await findRawBalances(quote.code, accountId)
  const balanceForOrderReserveCurrency = rawBalances.find(({ balanceTypeId }) => balanceTypeId === BalanceType.reserved)

  const { rows: buyTradeTransactions } = await findTradeTransactions({ where: { orderId: orderId! } })
  const counterTradeTransactionIds = buyTradeTransactions.map(({ counterTradeTransactionId }) => counterTradeTransactionId)

  const balanceAdjustmentsForTradeTransactions = await getBalanceAdjustmentsForBalanceAndTradeTransactions(
    balanceForOrderReserveCurrency!.id!,
    counterTradeTransactionIds,
  )

  return balanceAdjustmentsForTradeTransactions.reduce((acc, { delta }) => acc + Math.abs(delta), 0)
}
