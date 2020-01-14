import { SourceEventType } from './enum'
import { Transaction } from 'sequelize'

export interface BalanceChangeParams {
  sourceEventType: SourceEventType
  sourceEventId: number
  currencyId: number
  accountId: string
  amount: number
  t?: Transaction
  initialReserve?: number
}
