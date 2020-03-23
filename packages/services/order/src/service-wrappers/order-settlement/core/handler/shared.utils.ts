import { BalanceType } from '@abx-types/balance'
import { Order, OrderMatchStatus } from '@abx-types/order'
import { SymbolPair } from '@abx-types/reference-data'
import { findTradeTransactions, findOrderMatchTransactions } from '../../../../core'
import { findRawBalances, getBalanceAdjustmentsForBalanceAndTradeTransactions } from '@abx-service-clients/balance'
import { Transaction } from 'sequelize'

export async function balanceAdjustmentsCreatedForAllPreviousTradeTransactions(
  orderId: number,
  accountId: string,
  quoteCurrencyId: number,
): Promise<boolean> {
  const rawBalances = await findRawBalances(quoteCurrencyId, accountId)
  const balanceForOrderReserveCurrency = rawBalances.find(({ balanceTypeId }) => balanceTypeId === BalanceType.reserved)

  const { rows: buyTradeTransactions } = await findTradeTransactions({ where: { orderId: orderId! } })
  const counterTradeTransactionIds = buyTradeTransactions.map(({ counterTradeTransactionId }) => counterTradeTransactionId)

  const balanceAdjustmentsForTradeTransactions = await getBalanceAdjustmentsForBalanceAndTradeTransactions(
    balanceForOrderReserveCurrency!.id!,
    counterTradeTransactionIds,
  )

  return balanceAdjustmentsForTradeTransactions.length === counterTradeTransactionIds.length
}

export async function retrieveTotalReleasedAmountForOrder({ id: orderId, accountId }: Order, { quote }: SymbolPair): Promise<number> {
  const rawBalances = await findRawBalances(quote.id, accountId)
  const balanceForOrderReserveCurrency = rawBalances.find(({ balanceTypeId }) => balanceTypeId === BalanceType.reserved)

  const { rows: buyTradeTransactions } = await findTradeTransactions({ where: { orderId: orderId! } })
  const counterTradeTransactionIds = buyTradeTransactions.map(({ counterTradeTransactionId }) => counterTradeTransactionId)

  const balanceAdjustmentsForTradeTransactions = await getBalanceAdjustmentsForBalanceAndTradeTransactions(
    balanceForOrderReserveCurrency!.id!,
    counterTradeTransactionIds,
  )

  return balanceAdjustmentsForTradeTransactions.reduce((acc, { delta }) => acc + Math.abs(delta), 0)
}

export async function allMatchesSettledExceptForCurrentOne(currentOrderMatchId: number, orderId: number, transaction: Transaction): Promise<boolean> {
  const orderMatches = await findOrderMatchTransactions({ where: { buyOrderId: orderId } }, transaction)

  return !orderMatches.find(({ id, status }) => id !== currentOrderMatchId && status === OrderMatchStatus.matched)
}
