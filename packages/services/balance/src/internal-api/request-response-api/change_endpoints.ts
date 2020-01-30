import { getEpicurusInstance, messageFactory, wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { RequestResponseBalanceMovementEndpoints } from '@abx-service-clients/balance'
import { balanceChangePayloadSchema } from './schema'
import { BalanceMovementFacade } from '../../core'

export function bootstrapChangeEndpoints() {
  const epicurus = getEpicurusInstance()
  const balanceMovementFacade = BalanceMovementFacade.getInstance()

  epicurus.server(
    RequestResponseBalanceMovementEndpoints.createReserve,
    messageFactory(balanceChangePayloadSchema, params => balanceMovementFacade.createReserve(params)),
  )

  epicurus.server(
    RequestResponseBalanceMovementEndpoints.updateAvailable,
    messageFactory(balanceChangePayloadSchema, params => balanceMovementFacade.updateAvailable(params)),
  )

  epicurus.server(
    RequestResponseBalanceMovementEndpoints.createPendingWithdrawal,
    messageFactory(balanceChangePayloadSchema, ({ pendingWithdrawalParams, pendingWithdrawalFeeParams }) => {
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
    }),
  )

  epicurus.server(
    RequestResponseBalanceMovementEndpoints.createPendingRedemption,
    messageFactory(balanceChangePayloadSchema, params => balanceMovementFacade.createPendingRedemption(params)),
  )

  epicurus.server(
    RequestResponseBalanceMovementEndpoints.createPendingDebitCardTopUp,
    messageFactory(balanceChangePayloadSchema, params => balanceMovementFacade.createPendingDebitCardTopUp(params)),
  )
}
