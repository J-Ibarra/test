import socketIo from 'socket.io'

import { Server } from 'http'
import { Logger } from '@abx-utils/logging'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { CORS_ENABLED_ORIGINS } from '@abx-utils/express-middleware'
import {
  emitAskDepthChange,
  emitBidDepthChange,
  recordSubscriptionForAccount,
  recordUnsubscribeForAccount,
} from './depth_update_notification_dispatcher'
import { OrderPubSubChannels } from '@abx-service-clients/order'
import { authenticateSocketConnection } from './socket_connection_authentication'

let io: SocketIO.Server
const logger = Logger.getInstance('market_data', 'depth-update')

export function openSocket(server?: Server): socketIo.Server {
  io = socketIo(server || 3001, {
    path: '/notifications/market-data-v2/depth-updates/',
    origins: CORS_ENABLED_ORIGINS,
    allowRequest: (request, callback) => authenticateSocketConnection(request, callback),
  } as any)

  const epicurus = getEpicurusInstance()

  epicurus.subscribe(OrderPubSubChannels.bidDepthUpdated, ({ symbolId, aggregateDepth, ordersFromDepth }) => {
    emitBidDepthChange(io, symbolId, aggregateDepth, ordersFromDepth)
  })

  epicurus.subscribe(OrderPubSubChannels.askDepthUpdated, ({ symbolId, aggregateDepth, ordersFromDepth }) => {
    emitAskDepthChange(io, symbolId, aggregateDepth, ordersFromDepth)
  })

  io.on('connection', (socket) => {
    logger.debug(`Socket id: ${socket.id}`)
    recordSubscriptionForAccount(socket.request.account.id, socket.id)

    socket.on('close', () => {
      recordUnsubscribeForAccount(socket.request.account.id, socket.id)
    })
    socket.on('disconnect', () => recordUnsubscribeForAccount(socket.request.account.id, socket.id))
  })

  return io
}

export function closeSocket() {
  io.close()
}
