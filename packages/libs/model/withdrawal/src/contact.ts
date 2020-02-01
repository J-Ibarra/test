import { CurrencyCode } from '@abx-types/reference-data'

export interface Contact {
  id?: number
  accountId: string
  currencyCode: CurrencyCode
  name: string
  publicKey: string
}
