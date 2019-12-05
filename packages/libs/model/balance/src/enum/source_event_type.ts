export enum SourceEventType {
  adminRequest = 'adminRequest',
  orderReserve = 'orderReserve',
  orderMatchRelease = 'orderMatchRelease',
  orderMatch = 'orderMatch',
  orderCancellation = 'orderCancellation',
  currencyDeposit = 'currencyDeposit',
  currencyWithdrawal = 'currencyWithdrawal',
  currencyDepositRequest = 'currencyDepositRequest',
  currencyWithdrawalFee = 'currencyWithdrawalFee',
  debitCardToExchangeWithdrawal = 'debitCardToExchangeWithdrawal',
  debitCardTopUp = 'debitCardTopUp',
}
