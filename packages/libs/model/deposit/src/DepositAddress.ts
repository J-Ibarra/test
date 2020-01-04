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
}
