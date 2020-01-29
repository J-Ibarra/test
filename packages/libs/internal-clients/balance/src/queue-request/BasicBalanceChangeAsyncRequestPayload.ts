import { SourceEventType } from '@abx-types/balance'

export interface BasicBalanceAsyncRequestPayload {
  sourceEventType: SourceEventType
  sourceEventId: number
  currencyId: number
  accountId: string
  amount: number
}
