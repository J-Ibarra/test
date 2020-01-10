export enum RequestResponseBalanceMovementEndpoints {
  createReserve = 'exchange:balance:createReserve',
  updateAvailable = 'exchange:balance:updateAvailable',

  createPendingRedemption = 'exchange:balance:createPendingRedemption',

  createPendingWithdrawal = 'exchange:balance:createPendingWithdrawal',
  createPendingWithdrawalFee = 'exchange:balance:createPendingWithdrawalFee',

  createPendingDebitCardTopUp = 'exchange:balance:createPendingDebitCardTopUp',
}
