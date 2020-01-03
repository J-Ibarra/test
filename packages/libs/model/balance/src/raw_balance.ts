import { BalanceType, IBalanceType } from './enum/balance_type'

export interface RawBalance {
  id?: number
  accountId: string
  currencyId: number
  balanceTypeId: BalanceType
  balanceType?: IBalanceType
  value?: number
}
