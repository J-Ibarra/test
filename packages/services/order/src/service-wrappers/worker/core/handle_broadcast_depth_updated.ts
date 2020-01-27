import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { DepthUpdate } from '@abx-types/order'
import { OrderPubSubChannels } from '@abx-service-clients/order'

export function broadcastBidDepthUpdate(depthUpdate: DepthUpdate) {
  const epicurus = getEpicurusInstance()

  epicurus.publish(OrderPubSubChannels.bidDepthUpdated, depthUpdate)
}

export function broadcastAskDepthUpdate(depthUpdate: DepthUpdate) {
  const epicurus = getEpicurusInstance()

  epicurus.publish(OrderPubSubChannels.askDepthUpdated, depthUpdate)
}
