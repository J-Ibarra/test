import { Logger } from '@abx/logging'
import { Order, OrderModuleState } from '@abx-types/order'
import { matchOrderAgainstDepth } from './order_match_orchestrator'

const logger = Logger.getInstance('lib', 'order_match_orchestrator')

export default async function performOrderMatch(state: OrderModuleState, order: Order) {
  try {
    return matchOrderAgainstDepth(order, state)
  } catch (e) {
    logger.error(`Error ocurred while performing order match for order ${order.id}`)
    throw e
  }
}
