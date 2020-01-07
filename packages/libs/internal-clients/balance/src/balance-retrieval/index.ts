import { getEpicurusInstance } from '@abx/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { Transaction } from 'sequelize'
import { BalanceRetrievalEndpoints } from './endpoints'

export function findBalance(currency: CurrencyCode, accountId: string, transaction?: Transaction) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceRetrievalEndpoints.findBalance, { currency, accountId, transaction })
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
