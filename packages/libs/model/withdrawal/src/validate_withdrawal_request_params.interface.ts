import { Currency } from '@abx-types/reference-data'

/**
 * interface to calls to @link {`validatWithdrawalRequest`} as first argument
 */
export interface ValidateWithdrawalRequestParams {
  account: Account
  address: string
  amount: number
  currency: Currency
}
