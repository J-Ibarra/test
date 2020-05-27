import { expect } from 'chai'
import sinon from 'sinon'

import socketClient from 'socket.io-client'
import { AccountType } from '@abx-types/account'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { closeSocket, openSocket } from '../depth-update.sockets'
import { clientsConnectedToSocket, DEPTH_UPDATE_EVENT_PREFIX } from '../depth_update_notification_dispatcher'
import { createAccountAndSession } from '@abx-utils/account'
import { OrderPubSubChannels } from '@abx-service-clients/order'
import * as middlewareOperations from '@abx-utils/express-middleware'

describe('depth-update-sockets', () => {
  const testDepth = [
    { price: 20, amount: 20 },
    { price: 19, amount: 10 },
  ]

  before(() => {
    openSocket()
  })

  after(() => {
    closeSocket()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should not allow unauthorized subscription', async () => {
    try {
      sinon.stub(middlewareOperations, 'overloadRequestWithSessionInfo').callsFake((request) => request as any)
      const socket = await connectAndWaitForSocketToOpen()

      expect(socket).to.be(undefined as any)
    } catch (e) {
      return
    }
  }).timeout(20_000)

  it('should be able to subscribe and receive ask depth updates when cookie present', async () => {
    const { cookie } = await createAccountAndSession(AccountType.individual)

    const socket = await connectAndWaitForSocketToOpen({ cookie })

    const epicurus = getEpicurusInstance()
    let depthUpdateReceived
    socket.on(`${DEPTH_UPDATE_EVENT_PREFIX}KAU_KAG`, function ({ aggregateDepth }) {
      depthUpdateReceived = aggregateDepth
    })

    epicurus.publish(OrderPubSubChannels.askDepthUpdated, {
      symbolId: 'KAU_KAG',
      topOfDepthUpdated: false,
      aggregateDepth: testDepth,
      oppositeDepthTopOrder: { price: 10, amount: 10 },
      ordersFromDepth: [],
    })

    await waitForPredicateToBecomeTrue(() => !!depthUpdateReceived)
    socket.close()
    expect(depthUpdateReceived).to.eql(testDepth.map((depthItem) => ({ ...depthItem, ownedAmount: 0 })))
  }).timeout(20_000)

  it('should be able to subscribe and receive bid depth updates when cookie present', async () => {
    const { cookie } = await createAccountAndSession(AccountType.individual)

    const socket = await connectAndWaitForSocketToOpen({ cookie })

    const epicurus = getEpicurusInstance()
    let depthUpdateReceived
    socket.on(`${DEPTH_UPDATE_EVENT_PREFIX}KAU_KAG`, function ({ aggregateDepth }) {
      depthUpdateReceived = aggregateDepth
    })

    epicurus.publish(OrderPubSubChannels.bidDepthUpdated, {
      symbolId: 'KAU_KAG',
      topOfDepthUpdated: false,
      aggregateDepth: testDepth,
      oppositeDepthTopOrder: { price: 10, amount: 10 },
      ordersFromDepth: [],
    })

    await waitForPredicateToBecomeTrue(() => !!depthUpdateReceived)
    socket.close()
    expect(depthUpdateReceived).to.eql(testDepth.map((depthItem) => ({ ...depthItem, ownedAmount: 0 })))
  }).timeout(20_000)
})

const connectAndWaitForSocketToOpen = async (extraHeaders = {}) => {
  let socket
  try {
    socket = socketClient('http://localhost:3001', { path: '/notifications/market-data-v2/depth-updates', extraHeaders })

    await waitForSocketToOpen()

    return socket
  } catch (e) {
    socket.close()
    throw e
  }
}

const waitForSocketToOpen = async (counter = 0) => {
  if (counter === 2) {
    if (!clientsConnectedToSocket()) {
      throw new Error('Unable to connect client to server socket')
    } else {
      return
    }
  }

  await new Promise((res) => setTimeout(() => res(), 2000))

  if (!clientsConnectedToSocket()) {
    return waitForSocketToOpen(counter + 1)
  }
}

const waitForPredicateToBecomeTrue = async (predicate, counter = 0) => {
  if (predicate()) {
    return
  } else if (counter === 2) {
    throw new Error('Predicate could not be satisfied')
  }

  await new Promise((res) => setTimeout(() => res(), 2000))

  return waitForPredicateToBecomeTrue(predicate)
}
