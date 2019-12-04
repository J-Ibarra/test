
export interface PreferredCurrencyEnrichedBalance {
  currency: CurrencyCode
  total: BalanceAmount
  available: BalanceAmount
  reserved: BalanceAmount
  pendingDeposit: BalanceAmount
  pendingWithdrawal: BalanceAmount
  pendingRedemption: BalanceAmount
  pendingDebitCardTopUp: BalanceAmount
  displayFormat?: EDisplayFormats
}
