import Decimal from 'decimal.js'
import socketIo from 'socket.io'
import { Logger } from '@abx-utils/logging'
import { Order, OrderDirection } from '@abx-types/order'
import { DepthItem } from '@abx-types/depth-cache'
import { DepthItemWithOwnMarker } from '@abx-utils/in-memory-depth-cache'

/** Contains the account socket details for all accounts. */
const accountIdToSocketId: Map<string, string> = new Map()

export const DEPTH_UPDATE_EVENT_PREFIX = 'depth-change:'

const logger = Logger.getInstance('depth_update_notification_dispatcher', 'recordSubscriptionForAccount')

export async function recordSubscriptionForAccount(accountId: string, socketId: string) {
  if (!accountIdToSocketId.has(accountId)) {
    logger.info(`Account ${accountId} subscribed to depth changes`)
  }

  accountIdToSocketId.set(accountId, socketId)
}

export async function recordUnsubscribeForAccount(accountId: string, socketId: string) {
  if (accountIdToSocketId.get(accountId) === socketId) {
    logger.info(`Account ${accountId} unsubscribed from depth changes`)
    accountIdToSocketId.delete(accountId)
  }
}

export async function emitAskDepthChange(io: socketIo.Server, symbolId: string, aggregateDepth: DepthItem[], ordersFromDepth: Order[]) {
  logger.debug(`Ask depth for symbol ${symbolId} changed to ${JSON.stringify(aggregateDepth)}`)

  Array.from(accountIdToSocketId.keys()).forEach(accountId => {
    logger.debug(`Emitting ask depth change to ${accountId}`)
    logger.debug(`Socket for account ${accountId}: ${accountIdToSocketId.get(accountId)}`)

    io.to(accountIdToSocketId.get(accountId)!).emit(`${DEPTH_UPDATE_EVENT_PREFIX}${symbolId}`, {
      direction: OrderDirection.sell,
      aggregateDepth: enrichWithOwnedAmount(aggregateDepth, getAccountOrderFromDepth(ordersFromDepth, OrderDirection.sell, accountId, symbolId)),
    })
  })
}

export async function emitBidDepthChange(io: socketIo.Server, symbolId: string, aggregateDepth: DepthItem[], ordersFromDepth: Order[]) {
  logger.debug(`Bid depth for symbol ${symbolId} changed to ${JSON.stringify(aggregateDepth)}`)

  Array.from(accountIdToSocketId.keys()).forEach(accountId => {
    logger.debug(`Emitting bid depth change to ${accountId}`)
    logger.debug(`Socket for account ${accountId}: ${accountIdToSocketId.get(accountId)}`)

    io.to(accountIdToSocketId.get(accountId)!).emit(`${DEPTH_UPDATE_EVENT_PREFIX}${symbolId}`, {
      direction: OrderDirection.buy,
      aggregateDepth: enrichWithOwnedAmount(aggregateDepth, getAccountOrderFromDepth(ordersFromDepth, OrderDirection.buy, accountId, symbolId)),
    })
  })
}

export function enrichWithOwnedAmount(aggregateDepth: DepthItem[], ordersForAccount: Order[]): DepthItemWithOwnMarker[] {
  const orderPriceToAmount = ordersForAccount.reduce((acc, { limitPrice, remaining }) => {
    if (!acc[limitPrice!]) {
      acc[limitPrice!] = remaining
    } else {
      acc[limitPrice!] = new Decimal(acc[limitPrice!]).plus(remaining).toNumber()
    }
    return acc
  }, {} as Record<number, number>)

  return aggregateDepth.reduce((acc, depthItem) => {
    acc.push({
      price: depthItem.price,
      amount: depthItem.amount,
      ownedAmount: orderPriceToAmount[depthItem.price] || 0,
    })

    return acc
  }, [] as DepthItemWithOwnMarker[])
}

export function clientsConnectedToSocket() {
  return accountIdToSocketId.size > 0
}

export function getAccountOrderFromDepth(ordersFromDepth: Order[], orderDirection: OrderDirection, accountId: string, symbolId: string): Order[] {
  return ordersFromDepth.filter(order => {
    return order.accountId === accountId && order.direction === orderDirection && order.symbolId === symbolId
  })
}
