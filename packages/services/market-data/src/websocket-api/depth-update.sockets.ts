import socketIo from 'socket.io'

import { Server } from 'http'
import { Logger } from '@abx/logging'
import { getEpicurusInstance } from '@abx/db-connection-utils'
import { overloadRequestWithSessionInfo, CORS_ENABLED_ORIGINS } from '@abx/express-middleware'
import {
  emitAskDepthChange,
  emitBidDepthChange,
  recordSubscriptionForAccount,
  recordUnsubscribeForAccount,
} from './depth_update_notification_dispatcher'
import { OrderPubSubChannels } from '@abx-service-clients/order'

let io: SocketIO.Server
const logger = Logger.getInstance('market_data', 'depth-update')

export function openSocket(server?: Server) {
  io = socketIo(server || 3001, {
    path: '/notifications/market-data-v2/depth-updates/',
    origins: CORS_ENABLED_ORIGINS,
    allowRequest: async (request, callback) => {
      const cookies = request.headers.cookie ? request.headers.cookie.split('; ') : []
      request.header = (headerName: string) => request.headers[headerName.toLowerCase()]

      const appSessionCookie = cookies.find(cookiePair => cookiePair.startsWith('appSession'))
      if (!!appSessionCookie) {
        request.cookies = {
          appSession: appSessionCookie.split('=')[1],
        }
      }

      await overloadRequestWithSessionInfo(request)

      if (!!request.account) {
        return callback(undefined, true)
      }

      return callback(undefined, false)
    },
  } as any)

  const epicurus = getEpicurusInstance()

  epicurus.subscribe(OrderPubSubChannels.bidDepthUpdated, ({ symbolId, aggregateDepth, ordersFromDepth }) => {
    emitBidDepthChange(io, symbolId, aggregateDepth, ordersFromDepth)
  })

  epicurus.subscribe(OrderPubSubChannels.askDepthUpdated, ({ symbolId, aggregateDepth, ordersFromDepth }) => {
    emitAskDepthChange(io, symbolId, aggregateDepth, ordersFromDepth)
  })

  io.on('connection', socket => {
    logger.debug(`Socket id: ${socket.id}`)
    recordSubscriptionForAccount(socket.request.account.id, socket.id)

    socket.on('close', () => {
      recordUnsubscribeForAccount(socket.request.account.id, socket.id)
    })
    socket.on('disconnect', () => recordUnsubscribeForAccount(socket.request.account.id, socket.id))
  })
}

export function closeSocket() {
  io.close()
}
