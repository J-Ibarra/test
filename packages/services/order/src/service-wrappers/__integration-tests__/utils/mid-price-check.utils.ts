import { DepthUpdate } from '@abx-types/order'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { OrderPubSubChannels } from '@abx-service-clients/order'

let askDepthUpdates: DepthUpdate[] = []
let bidDepthUpdates: DepthUpdate[] = []

export function subscribeToDepthUpdateEvents() {
  askDepthUpdates = []
  bidDepthUpdates = []

  getEpicurusInstance().subscribe(OrderPubSubChannels.bidDepthUpdated, depthUpdate => {
    bidDepthUpdates.push(depthUpdate)
  })
  getEpicurusInstance().subscribe(OrderPubSubChannels.askDepthUpdated, depthUpdate => {
    askDepthUpdates.push(depthUpdate)
  })
}

export async function verifyTopOfBidDepthUpdatedEventDispatched(expectedPriceAtTop: number) {
  return verifyTopOfDepthUpdated(bidDepthUpdates, expectedPriceAtTop)
}

export async function verifyTopOfAskDepthUpdatedEventDispatched(expectedPriceAtTop: number) {
  return verifyTopOfDepthUpdated(askDepthUpdates, expectedPriceAtTop)
}

export async function verifyTopOfDepthUpdated(depthUpdates, expectedPriceAtTop: number) {
  const topOfDepthUpdateEvent = depthUpdates.find(({ topOfDepthUpdated, ordersFromDepth }) => {
    return topOfDepthUpdated && (expectedPriceAtTop !== 0 ? ordersFromDepth[0].limitPrice === expectedPriceAtTop : ordersFromDepth.length === 0)
  })

  return !!topOfDepthUpdateEvent
}
