import { BalanceAsyncRequestType } from './BalanceChangeAsyncRequestType.enum'
import { BasicBalanceAsyncRequestPayload } from './BasicBalanceChangeAsyncRequestPayload'
import { InitialReserveBalanceChangeAsyncRequestPayload } from './InitialReserveBalanceChangeAsyncRequestPayload'

export interface BalanceChangeAsyncRequest {
  type: BalanceAsyncRequestType
  payload: BasicBalanceAsyncRequestPayload | InitialReserveBalanceChangeAsyncRequestPayload
}
