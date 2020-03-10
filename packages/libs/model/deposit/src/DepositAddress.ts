import { Account } from '@abx-types/account'
import { Currency } from '@abx-types/reference-data'

export interface DepositAddress {
  id?: number
  account?: Account
  accountId: string
  currency?: Currency
  currencyId: number
  encryptedPrivateKey: string
  publicKey: string
  address?: string
  encryptedWif?: string
  /**
   * When an address is activated Kinesis is actively monitoring the address for new transactions
   * processing them as deposits.
   */
  transactionTrackingActivated?: boolean
}
