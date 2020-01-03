import { BalanceAsyncRequestType } from './BalanceChangeAsyncRequestType.enum'
import { BasicBalanceAsyncRequestPayload } from './BasicBalanceChangeAsyncRequestPayload'

export interface BalanceChangeAsyncRequest {
  type: BalanceAsyncRequestType
  payload: BasicBalanceAsyncRequestPayload
}
