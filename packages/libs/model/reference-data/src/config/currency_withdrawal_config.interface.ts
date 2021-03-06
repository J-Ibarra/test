import { CurrencyCode } from '../currency_code.enum'

export interface CurrencyWithdrawalConfig {
  feeCurrency: CurrencyCode
  feeAmount: number
  minimumAmount: number
  /** The maximum fee that Kinesis is willing to pay for that currency transaction. */
  transactionFeeCap?: number
  /** The increment that Kinesis wants to add when calculating the fee to be paid, in order to stay ahead of the competition (priority-wise). */
  transactionFeeIncrement?: number
}
