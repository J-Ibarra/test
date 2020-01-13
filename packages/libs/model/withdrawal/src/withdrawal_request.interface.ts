import { WithdrawalState } from './withdrawal_state.enum'
import { Currency, FiatCurrency } from '@abx-types/reference-data'
import { WithdrawalRequestType } from './withdrawal_request_type.enum'

/**
 * Interface for the withdrawal request model
 */
export interface WithdrawalRequest {
  id?: number
  amount: number
  state: WithdrawalState
  address?: string
  currencyId: number
  feeCurrencyId?: number
  account?: Account
  accountId: string
  txHash?: string
  memo?: string
  fiatCurrencyCode: FiatCurrency
  fiatConversion: number
  kauConversion: number
  type: WithdrawalRequestType
  /**
   * The on chain transaction fee (for a non-kinesis crypto currency) for the withdrawal transaction
   * covered by kinesis, deducted from the total withdrawal fee.
   * This is used when completing withdrawal, to make sure the correct amount is transferred
   * pending deposit -> available for the kinesis revenue account.
   */
  kinesisCoveredOnChainFee?: number
  createdAt?: Date
  updatedAt?: Date
  /**
   * These parameters are needed for SalesForce and are fetched from admin_request table
   */
  transactionId?: string
  transactionFee?: number
  adminRequestId?: number
}

export interface CurrencyEnrichedWithdrawalRequest extends WithdrawalRequest {
  feeCurrency?: Currency
  currency: Currency
}
