import { Currency } from '@abx-types/reference-data/src'
import { BalanceTypeObj } from './balance_type_obj'
import { IBalanceType } from './enum/balance_type'

export interface RawBalance {
  id?: number
  accountId: string
  currencyId: number
  fullCurrencyDetails?: Currency
  balanceTypeId: BalanceTypeObj
  balanceType?: IBalanceType
  value?: number
}
