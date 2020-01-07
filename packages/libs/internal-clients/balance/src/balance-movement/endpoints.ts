export enum BalanceMovementEndpoints {
    createReserve = 'exchange:balance:createReserve',
    releaseReserve = 'exchange:balance:releaseReserve',
    finaliseReserve = 'exchange:balance:finaliseReserve',
    updateAvailable = 'exchange:balance:updateAvailable',
    
    createPendingRedemption = 'exchange:balance:createPendingRedemption',
    confirmPendingRedemption = 'exchange:balance:confirmPendingRedemption',
    denyPendingRedemption = 'exchange:balance:denyPendingRedemption',

    createPendingDeposit = 'exchange:balance:createPendingDeposit',
    confirmPendingDeposit = 'exchange:balance:confirmPendingDeposit',
    denyPendingDeposit = 'exchange:balance:denyPendingDeposit',
    
    createPendingWithdrawal = 'exchange:balance:createPendingWithdrawal',
    createPendingWithdrawalFee = 'exchange:balance:createPendingWithdrawalFee',
    confirmPendingWithdrawal = 'exchange:balance:confirmPendingWithdrawal',
    denyPendingWithdrawall = 'exchange:balance:denyPendingWithdrawal',
    
    createPendingDebitCardTopUp = 'exchange:balance:createPendingDebitCardTopUp',
    confirmPendingDebitCardTopUp = 'exchange:balance:confirmPendingDebitCardTopUp',
    recordDebitCardToExchangeWithdrawal = 'exchange:balance:recordDebitCardToExchangeWithdrawal',
}
  