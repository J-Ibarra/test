import { BalanceChangeAsyncRequestContainer } from '@abx-service-clients/balance'
import { BalanceMovementFacade } from '../../core/balance_movement_facade'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'

const balanceMovementFacade = BalanceMovementFacade.getInstance()

export function consumeQueueMessage({ requestedChanges }: BalanceChangeAsyncRequestContainer) {
  return wrapInTransaction(sequelize, null, async tran => {
    await Promise.all(
      requestedChanges.map(change => {
        const targetBalanceMovementFn = balanceMovementFacade[change.type].bind(balanceMovementFacade)

        return targetBalanceMovementFn({
          ...change.payload,
          t: tran,
        })
      }),
    )
  })
}
