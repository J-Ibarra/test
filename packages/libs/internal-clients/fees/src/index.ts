import { getEpicurusInstance } from '@abx/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { Transaction } from 'sequelize'
import { FeesDataEndpoints } from './endpoints'

export function getMaxFeeRate(accountId: string, symbolId: string): Promise<number> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(FeesDataEndpoints.getMaxFeeRate, { accountId, symbolId })
}

export function determineMaxBuyReserve({
  orderId,
  price,
  amount,
  accountId,
  symbolId,
  feeCurrencyCode,
  maxDecimalsForCurrency,
  transaction,
}: {
  orderId: number
  price: number
  amount: number
  accountId: string
  symbolId: string
  feeCurrencyCode: CurrencyCode
  maxDecimalsForCurrency: number
  transaction: Transaction
}): Promise<number> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(FeesDataEndpoints.determineMaxBuyReserve, {
    orderId,
    price,
    amount,
    accountId,
    symbolId,
    feeCurrencyCode,
    maxDecimalsForCurrency,
    transaction,
  })
}

export function determineMaxReserveForTradeValue({
  amount,
  accountId,
  symbolId,
  maxDecimalsForCurrency,
  feeCurrencyCode,
  t,
}: {
  amount: number
  accountId: string
  symbolId: string
  maxDecimalsForCurrency: number
  feeCurrencyCode: CurrencyCode
  t: Transaction
}): Promise<number> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(FeesDataEndpoints.determineMaxReserveForTradeValue, {
    amount,
    accountId,
    symbolId,
    maxDecimalsForCurrency,
    feeCurrencyCode,
    t,
  })
}

export function getMonthlyTradeAccumulationForAccount(accountId: string, date: Date, transaction?: Transaction): Promise<number> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(FeesDataEndpoints.getMonthlyTradeAccumulationForAccount, {
    accountId,
    date,
    transaction,
  })
}

export * from './endpoints'
