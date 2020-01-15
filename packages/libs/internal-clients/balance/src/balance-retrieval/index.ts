import { getEpicurusInstance } from '@abx/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { BalanceRetrievalEndpoints } from './endpoints'
import { Balance, CompleteBalanceDetails, RawBalance } from '@abx-types/balance'

export function findBalance(currency: CurrencyCode, accountId: string): Promise<Balance> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findBalance, { currency, accountId })
}

export function findCurrencyBalances(currencies: CurrencyCode[], accountId: string): Promise<Balance[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findCurrencyBalances, { currencies, accountId })
}

export function findAllBalancesForAccount(accountId: string): Promise<CompleteBalanceDetails> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findAllBalancesForAccount, { accountId })
}

export function findRawBalances(currency: CurrencyCode, accountId: string): Promise<RawBalance[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findRawBalances, { currency, accountId })
}

export function retrieveTotalOrderValueReceivedByAccount(accountId: string, currencyReceivedId: number, tradeTransactionId: number[]) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findRawBalances, { accountId, currencyReceivedId, tradeTransactionId })
}

export function getBalanceAdjustmentForBalanceAndOrder(balanceId: number, orderId: number) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findRawBalances, { balanceId, orderId })
}

export function getBalanceAdjustmentsForBalanceAndTradeTransactions(balanceId: number, counterTradeTransactionIds: number[]) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.getBalanceAdjustmentsForBalanceAndTradeTransactions, { balanceId, counterTradeTransactionIds })
}
export * from './endpoints'
