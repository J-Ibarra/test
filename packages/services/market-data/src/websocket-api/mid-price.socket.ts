import socketIo from 'socket.io'

import { Server } from 'http'
import { Logger } from '@abx-utils/logging'
import { CORS_ENABLED_ORIGINS } from '@abx-utils/express-middleware'
import { getMidPriceLiveStream, getLatestMidPrice, getDailyChange } from '../core'
import { getAllSymbolPairSummaries } from '@abx-service-clients/reference-data'
import { authenticateSocketConnection } from './socket_connection_authentication'

let io: SocketIO.Server
const logger = Logger.getInstance('market_data', 'mid-price')

let clientsConnected = 0

export async function openSocket(server?: Server) {
  io = socketIo(server || 3001, {
    path: '/notifications/market-data/mid-price/',
    origins: CORS_ENABLED_ORIGINS,
    allowRequest: (request, callback) => authenticateSocketConnection(request, callback),
  } as any)

  const midPriceLiveStream = getMidPriceLiveStream()
  const symbols = await getAllSymbolPairSummaries()

  symbols.forEach(({ id: symbolId }) =>
    midPriceLiveStream.on(symbolId, async (price) => {
      const dailyChanges = await getDailyChange([symbolId])

      io.to(symbolId).emit('onChange', {
        price,
        dailyChange: dailyChanges.get(symbolId),
      })
    }),
  )

  io.on('connection', (socket) => {
    logger.debug(`Processing mid-price socket connection with id: ${socket.id}`)

    const { symbolId } = socket.handshake.query
    const formattedSymbolId = (symbolId || '').includes('/') ? symbolId.substring(0, symbolId.indexOf('/')) : symbolId

    logger.debug(`Query: ${JSON.stringify(socket.handshake.query)}`)
    logger.debug(`Formatted SymbolId: ${formattedSymbolId}`)

    if (!formattedSymbolId) {
      logger.debug('Received socket connection where symbolId parameter not set')
    } else {
      clientsConnected++

      logger.debug(
        `Subscribing account ${socket.request.account.id} to ${formattedSymbolId} mid-price socket. Clients subscribed ${clientsConnected}`,
      )

      socket.join(formattedSymbolId)
      process.nextTick(async () => {
        const latestMidPrice = await getLatestMidPrice(formattedSymbolId)
        const dailyChanges = await getDailyChange([symbolId])

        socket.emit('onInit', {
          price: latestMidPrice,
          dailyChange: dailyChanges.get(symbolId),
        })
      })

      socket.on('close', () => clientsConnected--)
    }
  })
}

export function clientsConnectedToSocket() {
  return clientsConnected > 0
}

export function closeSocket() {
  io.close()
}
