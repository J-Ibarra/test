import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { BalanceRetrievalEndpoints } from './endpoints'
import { Balance, RawBalance, BalanceAdjustment } from '@abx-types/balance'

export function findBalance(currency: CurrencyCode, accountId: string): Promise<Balance> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findBalance, { currency, accountId })
}

export function findCurrencyAvailableBalances(currencies: CurrencyCode[], accountId: string): Promise<Map<CurrencyCode, number>> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findCurrencyAvailableBalances, { currencies, accountId })
}

export function findAllBalancesForAccount(accountId: string): Promise<Balance[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findAllBalancesForAccount, { accountId })
}

export function findRawBalances(currency: CurrencyCode, accountId: string): Promise<RawBalance[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findRawBalances, { currency, accountId })
}

export function retrieveTotalOrderValueReceivedByAccount(accountId: string, currencyReceivedId: number, tradeTransactionIds: number[]) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.retrieveTotalOrderValueReceivedByAccount, { accountId, currencyReceivedId, tradeTransactionIds })
}

/** Retrieves the balance adjustment corresponding to an order balance reserve. */
export function getOrderBalanceReserveAdjustment(currencyCode: CurrencyCode, accountId: string, orderId: number): Promise<BalanceAdjustment> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.getOrderBalanceReserveAdjustment, { currencyCode, accountId, orderId })
}

export function getBalanceAdjustmentsForBalanceAndTradeTransactions(balanceId: number, tradeTransactionIds: number[]): Promise<BalanceAdjustment[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.getBalanceAdjustmentsForBalanceAndTradeTransactions, { balanceId, tradeTransactionIds })
}

export * from './endpoints'
