import { getEpicurusInstance } from '@abx/db-connection-utils'
import { BalanceChangeParams } from '@abx-types/balance'
import { RequestResponseBalanceMovementEndpoints } from './endpoints'

export function createReserve(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(RequestResponseBalanceMovementEndpoints.createReserve, { changeParams })
}

export function updateAvailable(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(RequestResponseBalanceMovementEndpoints.updateAvailable, { changeParams })
}

export function createPendingRedemption(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(RequestResponseBalanceMovementEndpoints.createPendingRedemption, { changeParams })
}

export function createPendingWithdrawal(pendingWithdrawalParams: BalanceChangeParams, pendingWithdrawalFeeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(RequestResponseBalanceMovementEndpoints.createPendingWithdrawal, { pendingWithdrawalParams, pendingWithdrawalFeeParams })
}

export function createPendingDebitCardTopUp(changeParams: BalanceChangeParams) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(RequestResponseBalanceMovementEndpoints.createPendingDebitCardTopUp, { changeParams })
}

export * from './endpoints'
