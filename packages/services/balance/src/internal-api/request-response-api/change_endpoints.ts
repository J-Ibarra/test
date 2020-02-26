import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { RequestResponseBalanceMovementEndpoints, E2eTestingBalanceEndpoints } from '@abx-service-clients/balance'
import { BalanceMovementFacade, BalanceRepository } from '../../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createChangeEndpointHandlers(): InternalRoute<any, any>[] {
  const balanceMovementFacade = BalanceMovementFacade.getInstance()
  const balanceRepository = BalanceRepository.getInstance()

  return [
    {
      path: RequestResponseBalanceMovementEndpoints.createReserve,
      handler: params => balanceMovementFacade.createReserve(params),
    },
    {
      path: RequestResponseBalanceMovementEndpoints.updateAvailable,
      handler: params => balanceMovementFacade.updateAvailable(params),
    },
    {
      path: RequestResponseBalanceMovementEndpoints.createPendingWithdrawal,
      handler: ({ pendingWithdrawalParams, pendingWithdrawalFeeParams }) => {
        return wrapInTransaction(sequelize, null, transaction => {
          return Promise.all([
            balanceMovementFacade.createPendingWithdrawal({
              ...pendingWithdrawalParams,
              t: transaction,
            }),
            balanceMovementFacade.createPendingWithdrawalFee({
              ...pendingWithdrawalFeeParams,
              t: transaction,
            }),
          ])
        })
      },
    },
    {
      path: RequestResponseBalanceMovementEndpoints.createPendingRedemption,
      handler: params => balanceMovementFacade.createPendingRedemption(params),
    },
    {
      path: RequestResponseBalanceMovementEndpoints.createPendingDebitCardTopUp,
      handler: params => balanceMovementFacade.createPendingDebitCardTopUp(params),
    },
    {
      path: E2eTestingBalanceEndpoints.setupAccountBalances,
      handler: ({ accountId, balances }) => balanceRepository.setupAccountBalances(accountId, balances),
    },
  ]
}
