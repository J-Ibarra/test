import { DepositAddress } from './DepositAddress'
import { DepositRequestStatus } from './enum'
import { FiatCurrency } from '@abx-types/reference-data'

export interface DepositRequest {
  id?: number
  depositAddressId?: number
  depositAddress: DepositAddress
  amount: number
  /** The transaction hash of the transaction into the deposit address. */
  depositTxHash: string
  /** The transaction hash of the transaction from the deposit address into the holdings address. */
  holdingsTxHash?: string
  /** The transaction for the on chain transaction recorded so that it can be rebated (subtracted) from the kinesis revenue account on deposit completion. */
  holdingsTxFee?: number
  from: string
  status: DepositRequestStatus
  fiatConversion: number
  fiatCurrencyCode: FiatCurrency
  updatedAt?: Date
}
