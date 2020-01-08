import { getEpicurusInstance } from '@abx/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { BalanceRetrievalEndpoints } from './endpoints'

export function findBalance(currency: CurrencyCode, accountId: string) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findBalance, { currency, accountId })
}

export function findAllBalancesForAccount(accountId: string) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findAllBalancesForAccount, { accountId })
}

export function findRawBalances(currency: CurrencyCode, accountId: string) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findRawBalances, { currency, accountId })
}

export * from './endpoints'
