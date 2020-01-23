import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { BalanceRetrievalEndpoints } from './endpoints'
import { Balance, RawBalance } from '@abx-types/balance'

export function findBalance(currency: CurrencyCode, accountId: string): Promise<Balance> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findBalance, { currency, accountId })
}

export function findCurrencyBalances(currencies: CurrencyCode[], accountId: string): Promise<Balance[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findCurrencyBalances, { currencies, accountId })
}

export function findAllBalancesForAccount(accountId: string): Promise<Balance[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findAllBalancesForAccount, { accountId })
}

export function findRawBalances(currency: CurrencyCode, accountId: string): Promise<RawBalance[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findRawBalances, { currency, accountId })
}

export function retrieveTotalOrderValueReceivedByAccount(accountId: string, currencyReceivedId: number, tradeTransactionId: number[]) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.retrieveTotalOrderValueReceivedByAccount, { accountId, currencyReceivedId, tradeTransactionId })
}

export function getBalanceAdjustmentForBalanceAndOrder(balanceId: number, orderId: number) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.getBalanceAdjustmentForBalanceAndOrder, { balanceId, orderId })
}

/** Retrieves the balance adjustment corresponding to an order balance reserve. */
export function getOrderBalanceReserveAdjustment(currencyCode: CurrencyCode, accountId: string, orderId: number) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.getOrderBalanceReserveAdjustment, { currencyCode, accountId, orderId })
}

export function getBalanceAdjustmentsForBalanceAndTradeTransactions(balanceId: number, counterTradeTransactionIds: number[]) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.getBalanceAdjustmentsForBalanceAndTradeTransactions, { balanceId, counterTradeTransactionIds })
}
export * from './endpoints'
