import { processQueue } from '../gatekeeper'
import { HandlerState, OrderModuleConfig, OrderModuleState } from '@abx-types/order'
import { processOrderRequest } from './match'

export async function configure(configuration: OrderModuleConfig, state: OrderModuleState): Promise<HandlerState> {
  state.handler = {}

  state.handler.broadcast = {
    orderUpdated: configuration.broadcastOrderUpdated,
    orderMatched: configuration.broadcastOrderMatched,
  }

  const orderProcessFn = processOrderRequest.bind(null, state)
  processQueue(orderProcessFn)

  return state.handler
}
