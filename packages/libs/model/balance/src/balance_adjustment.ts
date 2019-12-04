import { RawBalance } from './raw_balance'
import { SourceEventType } from './enum'

export interface BalanceAdjustment {
  id?: number
  balance?: RawBalance
  balanceId: number
  sourceEventType: SourceEventType
  sourceEventId: number
  value: number
  delta: number
  createdAt?: Date
}
