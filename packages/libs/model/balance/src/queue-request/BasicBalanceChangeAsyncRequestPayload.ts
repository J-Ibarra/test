import { SourceEventType } from '../enum'

export interface BasicBalanceAsyncRequestPayload {
  sourceEventType: SourceEventType
  sourceEventId: number
  currencyId: number
  accountId: string
  amount: number
}
