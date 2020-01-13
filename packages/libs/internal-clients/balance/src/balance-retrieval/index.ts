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

export * from './endpoints'
