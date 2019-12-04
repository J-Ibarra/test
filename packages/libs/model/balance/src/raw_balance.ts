export interface RawBalance {
  id?: number
  accountId: string
  currencyId: number
  fullCurrencyDetails?: Currency
  balanceTypeId: BalanceType
  balanceType?: IBalanceType
  value?: number
}
