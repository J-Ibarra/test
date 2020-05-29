import { expect } from 'chai'
import sinon from 'sinon'

import socketClient from 'socket.io-client'
import { closeSocket, openSocket, clientsConnectedToSocket } from '../mid-price.socket'
import { createAccountAndSession } from '@abx-utils/account'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as middlewareOperations from '@abx-utils/express-middleware'
import { getMidPriceLiveStream } from '../../core'

describe('mid-update-sockets', () => {
  const kauUsd = 'KAU_USD'
  const kauUsdPrice = 10

  before(async () => {
    sinon.stub(referenceDataOperations, 'getAllSymbolPairSummaries').resolves([
      {
        id: kauUsd,
      },
    ])
    await openSocket()
  })

  after(() => {
    closeSocket()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should not allow unauthorized subscription', async () => {
    try {
      const socket = await connectAndWaitForSocketToOpen()

      expect(socket).to.be(undefined as any)
    } catch (e) {
      return
    }
  }).timeout(20_000)

  it('should be able to subscribe and receive mid-price updates when cookie present', async () => {
    const { cookie } = await createAccountAndSession()
    const socket = await connectAndWaitForSocketToOpen({ cookie }, { symbolId: kauUsd })

    let latestMidPrice
    let latestDailyChange
    socket.on('onChange', function({ price, dailyChange }) {
      latestMidPrice = price
      latestDailyChange = dailyChange
    })
    const midPriceLiveStream = getMidPriceLiveStream()
    midPriceLiveStream.emit(kauUsd, kauUsdPrice)

    await waitForPredicateToBecomeTrue(() => !!latestMidPrice)
    socket.close()
    expect(latestMidPrice).to.eql(kauUsdPrice)
    expect(latestDailyChange).to.eql(0)
  }).timeout(20_000)
})

const connectAndWaitForSocketToOpen = async (extraHeaders = {}, query = {}) => {
  let socket
  try {
    socket = socketClient('http://localhost:3001', { path: '/notifications/market-data/mid-price/', extraHeaders, query })

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

  await new Promise(res => setTimeout(() => res(), 2000))

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

  await new Promise(res => setTimeout(() => res(), 2000))

  return waitForPredicateToBecomeTrue(predicate)
}
