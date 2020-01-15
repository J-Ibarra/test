import { Logger } from '@abx/logging'
import { sequelize } from '@abx/db-connection-utils'
import { getCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { Order } from '@abx-types/order'
import { saveOrder } from '../../../core'
import { allocateReserveBalance } from '../../../core/reserve-balance-allocators'

const logger = Logger.getInstance('contract_exchange', 'prepareOrder')

/**
 * An unmanaged transaction is used here (i.e. sequelize.transaction({}).then())
 * because we want to manually rollback the transaction if the lock balance operation fails (within the 40sec timeout).
 * This is the done to cancel the actual lock query which has not succeeded during the timeout.
 */
export async function prepareOrder(order: Order): Promise<Order> {
  return sequelize
    .transaction({
      autocommit: false,
      isolationLevel: sequelize.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      deferrable: sequelize.Sequelize.Deferrable.SET_DEFERRED,
    } as any)
    .then(async transaction => {
      try {
        const symbol = await getCompleteSymbolDetails(order.symbolId)

        await allocateReserveBalance(order, symbol, transaction)

        const savedOrder = await saveOrder({ order, transaction })

        transaction.commit()
        return savedOrder
      } catch (e) {
        transaction.rollback()
        logger.error(
          `Error validating available balance for ${order.direction} order for ${order.amount} ${order.symbolId} and account ${order.accountId}`,
        )
        if (e.name !== 'ValidationError') {
          return prepareOrder(order)
        } else {
          throw e
        }
      }
    })
}
