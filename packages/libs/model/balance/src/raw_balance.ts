import { Currency } from '@abx-types/reference-data/src'
import { BalanceType, IBalanceType } from './enum/balance_type'

export interface RawBalance {
  id?: number
  accountId: string
  currencyId: number
  fullCurrencyDetails?: Currency
  balanceTypeId: BalanceType
  balanceType?: IBalanceType
  value?: number
}
