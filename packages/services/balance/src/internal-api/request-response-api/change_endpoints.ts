import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
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
    RequestResponseBalanceMovementEndpoints.createPendingWithdrawalFee,
    messageFactory(balanceChangePayloadSchema, params => balanceMovementFacade.createPendingWithdrawalFee(params)),
  )

  epicurus.server(
    RequestResponseBalanceMovementEndpoints.createPendingRedemption,
    messageFactory(balanceChangePayloadSchema, params => balanceMovementFacade.createPendingRedemption(params)),
  )

  epicurus.server(
    RequestResponseBalanceMovementEndpoints.createPendingWithdrawal,
    messageFactory(balanceChangePayloadSchema, params => balanceMovementFacade.createPendingWithdrawal(params)),
  )

  epicurus.server(
    RequestResponseBalanceMovementEndpoints.createPendingDebitCardTopUp,
    messageFactory(balanceChangePayloadSchema, params => balanceMovementFacade.createPendingDebitCardTopUp(params)),
  )
}
