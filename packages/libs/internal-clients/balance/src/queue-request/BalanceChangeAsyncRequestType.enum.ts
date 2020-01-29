/** Each endpoint here needs to have a respective handler function in {@code BalanceMovementFacade} from the integration to work. */
export enum BalanceAsyncRequestType {
  updateAvailable = 'updateAvailable',

  finaliseReserve = 'finaliseReserve',
  releaseReserve = 'releaseReserve',

  confirmPendingRedemption = 'confirmPendingRedemption',
  denyPendingRedemption = 'denyPendingRedemption',

  createPendingDeposit = 'createPendingDeposit',
  denyPendingDeposit = 'denyPendingDeposit',
  confirmPendingDeposit = 'confirmPendingDeposit',

  confirmPendingWithdrawal = 'confirmPendingWithdrawal',
  denyPendingWithdrawal = 'denyPendingWithdrawal',

  confirmPendingDebitCardTopUp = 'confirmPendingDebitCardTopUp',
  recordDebitCardToExchangeWithdrawal = 'recordDebitCardToExchangeWithdrawal',
}
