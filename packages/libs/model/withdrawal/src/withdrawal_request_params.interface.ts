import { CurrencyCode } from '@abx-types/reference-data'

/**
 * interface for withdrawals controller request to create a new withdrawal
 */
export interface WithdrawalRequestParams {
  address?: string
  amount: number
  currencyCode: CurrencyCode
  memo?: string
}
