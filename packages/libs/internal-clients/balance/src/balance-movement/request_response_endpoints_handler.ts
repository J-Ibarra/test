import { BalanceChangeParams } from '@abx-types/balance'
import { RequestResponseBalanceMovementEndpoints } from './request_response_endpoints'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { BALANCE_REST_API_PORT } from '../balance-retrieval'

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(BALANCE_REST_API_PORT)

export function createReserve(changeParams: BalanceChangeParams) {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(RequestResponseBalanceMovementEndpoints.createReserve, { ...changeParams })
}

export function updateAvailable(changeParams: BalanceChangeParams) {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(RequestResponseBalanceMovementEndpoints.updateAvailable, { ...changeParams })
}

export function createPendingRedemption(changeParams: BalanceChangeParams) {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(RequestResponseBalanceMovementEndpoints.createPendingRedemption, {
    ...changeParams,
  })
}

export function createPendingWithdrawal({
  pendingWithdrawalParams,
  pendingWithdrawalFeeParams,
}: {
  pendingWithdrawalParams: BalanceChangeParams
  pendingWithdrawalFeeParams?: BalanceChangeParams
}) {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(RequestResponseBalanceMovementEndpoints.createPendingWithdrawal, {
    pendingWithdrawalParams,
    pendingWithdrawalFeeParams,
  })
}

export function createPendingDebitCardTopUp(changeParams: BalanceChangeParams) {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(RequestResponseBalanceMovementEndpoints.createPendingWithdrawal, {
    ...changeParams,
  })
}

export * from './request_response_endpoints'
