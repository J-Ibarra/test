import { PayloadWrapper } from '../../../model'

export interface IBtcTransactionsFeeResponse extends PayloadWrapper<IBtcTransactionsFee> {}
export interface IBtcTransactionsFee {
  min: string
  max: string
  average: string
  min_fee_per_byte: string
  average_fee_per_byte: string
  max_fee_per_byte: string
  unit: string
}
