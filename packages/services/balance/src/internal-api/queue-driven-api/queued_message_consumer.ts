import { BalanceChangeAsyncRequestContainer } from '@abx-types/balance'
import { BalanceMovementFacade } from '../../core/balance_movement_facade'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'

const balanceMovementFacade = BalanceMovementFacade.getInstance()

export function consumerQueueMessage({ requestedChanges }: BalanceChangeAsyncRequestContainer) {
  return wrapInTransaction(sequelize, null, async tran => {
    await Promise.all(
      requestedChanges.map(change => {
        const targetBalanceMovementFn = balanceMovementFacade[change.type]

        return targetBalanceMovementFn({
          ...change,
          t: tran,
        })
      }),
    )
  })
}
