import { getAllSymbolPairSummaries } from '@abx-service-clients/reference-data'
import { OrderModuleConfig, OrderModuleExports, OrderModuleState } from '@abx-types/order'
import * as depthModule from './order-match-handling/depth'
import * as orderHandlerModule from './order-match-handling'
import { OrderCancellationGateway } from '../../order-gateway/core'

export async function configureWorker(configuration: OrderModuleConfig) {
  const state: OrderModuleState = {} as any
  state.depth = depthModule.configure(configuration, state)
  state.symbols = await getAllSymbolPairSummaries()
  state.handler = await orderHandlerModule.configure(configuration, state)
}

export async function configureOrderPlacement(): Promise<OrderModuleExports> {
  const orderCancellationGateway = OrderCancellationGateway.getInstance()

  return {
    cancelOrder: orderCancellationGateway.cancelOrder.bind(orderCancellationGateway),
    cancelAllOrdersForAccount: orderCancellationGateway.cancelOrdersOnAccount.bind(orderCancellationGateway),
  } as any
}
