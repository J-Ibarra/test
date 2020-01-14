export { addOrderToDepth } from './add_order'
export { getTopOrder } from './get_top_order'
export { removeOrderFromDepth } from './remove_order'
export { getOrder } from './get_order'
export { updateOrderInDepth } from './update_order'
export { getDepthForSymbol } from './depth_retrieval'
import { DepthState, OrderModuleConfig, OrderModuleState } from '@abx-types/order'
import { createDepthNotifier } from './notify_depth_updated'

export function configure(configuration: OrderModuleConfig, state: OrderModuleState): DepthState {
  state.depth = {
    muted: false,
    orders: {},
    broadcast: {
      depthUpdated: createDepthNotifier.bind(null, configuration, state),
    },
  }

  return state.depth
}
