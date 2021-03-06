import { BalanceChangeAsyncRequestContainer } from '@abx-service-clients/balance'
import { BalanceMovementFacade } from '../../core/balance_movement_facade'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('balance', 'queued_message_consumer')
const balanceMovementFacade = BalanceMovementFacade.getInstance()

export async function consumeQueueMessage(balanceChangeRequest: BalanceChangeAsyncRequestContainer) {
  logger.debug(`Consuming message ${JSON.stringify(balanceChangeRequest)}`)

  try {
    await wrapInTransaction(sequelize, null, async tran => {
      await Promise.all(
        balanceChangeRequest.requestedChanges.map(change => {
          const targetBalanceMovementFn = balanceMovementFacade[change.type].bind(balanceMovementFacade)

          return targetBalanceMovementFn({
            ...change.payload,
            t: tran,
          })
        }),
      )
    })
  } catch (e) {
    logger.error(`Error encountered while consuming balance change request: ${JSON.stringify(e)}`)
  }
}
