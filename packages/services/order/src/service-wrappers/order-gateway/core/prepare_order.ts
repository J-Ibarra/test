import { Logger } from '@abx/logging'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { getCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { Order } from '@abx-types/order'
import { saveOrder } from '../../../core'
import { allocateReserveBalance } from '../../../core/reserve-balance-allocators'

const logger = Logger.getInstance('contract_exchange', 'prepareOrder')

export async function prepareOrder(order: Order): Promise<Order> {
  return wrapInTransaction(sequelize, null, async transaction => {
    try {
      const symbol = await getCompleteSymbolDetails(order.symbolId)
      const savedOrder = await saveOrder({ order, transaction })

      await allocateReserveBalance(savedOrder, symbol, transaction)

      return savedOrder
    } catch (e) {
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
