import { getEpicurusInstance } from '@abx/db-connection-utils'
import { BalanceChangeParams } from '@abx-types/balance'
import { BalanceMovementEndpoints } from './endpoints'

export function createReserve(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.createReserve, { changeParams })
}

export function releaseReserve(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.releaseReserve, { changeParams })
}

export function finaliseReserve(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.finaliseReserve, { changeParams })
}

export function updateAvailable(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.updateAvailable, { changeParams })
}

export function createPendingRedemption(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.createPendingRedemption, { changeParams })
}

export function confirmPendingRedemption(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.confirmPendingRedemption, { changeParams })
}

export function denyPendingRedemption(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.denyPendingRedemption, { changeParams })
}

export function createPendingDeposit(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.createPendingDeposit, { changeParams })
}

export function confirmPendingDeposit(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.confirmPendingDeposit, { changeParams })
}

export function denyPendingDeposit(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.denyPendingDeposit, { changeParams })
}

export function createPendingWithdrawal(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.createPendingWithdrawal, { changeParams })
}

export function createPendingWithdrawalFee(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.createPendingWithdrawalFee, { changeParams })
}

export function confirmPendingWithdrawal(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.confirmPendingWithdrawal, { changeParams })
}

export function denyPendingWithdrawall(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.denyPendingWithdrawall, { changeParams })
}

export function createPendingDebitCardTopUp(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.createPendingDebitCardTopUp, { changeParams })
}

export function confirmPendingDebitCardTopUp(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.confirmPendingDebitCardTopUp, { changeParams })
}

export function recordDebitCardToExchangeWithdrawal(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(BalanceMovementEndpoints.recordDebitCardToExchangeWithdrawal, { changeParams })
}

export * from './endpoints'
