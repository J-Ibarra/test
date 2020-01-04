import { CurrencyCode } from '@abx-types/reference-data'

/**
 * interface for calls to @link {`initialiseWithdrawal`} handler
 */
export interface InitialiseWithdrawalParams {
  accountId: string
  address?: string
  amount: number
  currencyCode: CurrencyCode
  memo?: string
  transactionId?: string
  transactionFee?: number
  adminRequestId?: number
}
