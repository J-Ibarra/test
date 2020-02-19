import { CurrencyCode } from '@abx-types/reference-data'

export interface BalanceUpdateRequest {
  email: string
  balances: AccountSetupBalance[]
}

export interface AccountSetupBalance {
  amount: number
  currencyCode: CurrencyCode
}
