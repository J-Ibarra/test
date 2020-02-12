import { EventEmitter } from 'events'
import _ from 'lodash'
import { recordCustomEvent } from 'newrelic'
import { v4 } from 'node-uuid'
import { Logger } from '@abx-utils/logging'
import { sequelize, getModel, getCacheClient, wrapInTransaction, getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { Order, OrderQueueRequest, OrderQueueStatus } from '@abx-types/order'
import { SymbolPairSummary } from '@abx-types/reference-data'
import { OrderPubSubChannels } from '@abx-service-clients/order'
import { QueueInfo, Gate } from './model'
import { publishDbOrdersToQueue } from '../order-match-handling/lock_and_hydrate_orders'
import { getAllSymbolPairSummaries } from '@abx-service-clients/reference-data'

const logger = Logger.getInstance('contract_exchange', 'gatekeeper')
const redisClient = getCacheClient()
const queueEmitter = new EventEmitter()
let disable = false

export function queueLengths(symbolIds: string[]) {
  return Promise.all(
    _.map(
      symbolIds,
      async (symbolId: string): Promise<QueueInfo> => {
        const listLen = await redisClient.getListLength(`exchange:orders:queue:${symbolId}`)
        return { symbolId, length: listLen }
      },
    ),
  )
}

export function addToQueue(symbolId: string, orderRequest: OrderQueueRequest): Promise<Order> {
  const jobId = v4()
  orderRequest.jobId = jobId

  recordCustomEvent('event_add_order_request_to_queue', {
    requestType: orderRequest.requestType,
    orderId: orderRequest.order.id,
    symbolId,
  })

  return new Promise(async resolve => {
    await redisClient.addValueToHeadOfList<OrderQueueRequest>(`exchange:orders:queue:${symbolId}`, orderRequest)
    await redisClient.incrementHashField(`orderQueueLength`, `contract:${symbolId}`, 1)
    resolve(orderRequest.order)
  })
}

export async function resetGate(symbolId: string): Promise<void> {
  await getModel<OrderQueueStatus>('orderQueueStatus').update({ processing: false, lastProcessed: new Date() } as any, {
    where: { symbolId },
  })
}

export async function processContract(symbolId: string, orderRequestFn) {
  // Time to bail. Reset the gate and exit the loop without processing the job,
  // it'll get picked up by the next worker
  if (disable) {
    logger.debug(`processContract: resetting the gate for contract ${symbolId} as we are disabled`)
    return resetGate(symbolId)
  }

  const orderRequest = await redisClient.popLastElement<OrderQueueRequest>(`exchange:orders:queue:${symbolId}`)

  if (orderRequest) {
    await redisClient.incrementHashField(`orderQueueLength`, `contract:${symbolId}`, -1)

    const result = await orderRequestFn(orderRequest)

    if (result.err) {
      logger.error(`Error ocurred processing order ${orderRequest.order.id}`)
      logger.error(result.err)
    }

    const epicurus = getEpicurusInstance()
    logger.debug(`Order ${orderRequest.order.id} successfully processed`)
    epicurus.publish(OrderPubSubChannels.exchangeOrderEvents, result)
  }

  return resetGate(symbolId)
}

export async function processQueue(orderRequestFn: () => void) {
  const orderQueueLength = await redisClient.getAllHashValues(`orderQueueLength`)
  const contractsWithWork = _.compact(
    _.map(orderQueueLength, (requestLength: string, contractString: string) => {
      const outstandingRequests = parseInt(requestLength, 10)
      const symbolId = contractString.split(':')[1]
      return outstandingRequests > 0 ? symbolId : null
    }),
  )

  let ids
  if (contractsWithWork.length > 0) {
    ids = await wrapInTransaction(sequelize, null, async t => {
      const openGates = await getModel<OrderQueueStatus>('orderQueueStatus').findAll({
        where: {
          processing: false,
          symbolId: contractsWithWork,
        },
        order: [['symbolId', 'ASC']],
        transaction: t,
        lock: t.LOCK.UPDATE,
      })

      if (openGates.length === 0) {
        return
      }

      const firstTwentyOpenGates = _(openGates)
        .map(o => o.get())
        .sortBy(o => new Date(o.lastProcessed))
        .take(20)
        .value()

      const symbolIds = _.map(firstTwentyOpenGates, (gate: Gate) => gate.symbolId)

      await getModel<OrderQueueStatus>('orderQueueStatus').update(
        {
          processing: true,
          lastProcessed: new Date(),
        } as any,
        {
          where: {
            symbolId: symbolIds,
          },
          transaction: t,
        },
      )

      return symbolIds
    })
  }

  if (ids) {
    await Promise.all(_.map(ids, async (symbolId: string) => processContract(symbolId, orderRequestFn)))
  }

  if (!disable) {
    setTimeout(() => processQueue(orderRequestFn), 15)
  } else {
    logger.debug(`processQueue: Emitting shutdown event`)
    queueEmitter.emit(`queueEmitter:shutdown`)
  }

  return ids
}

// Trust that the hydration fires this one time. If it gets called twice the unique
// key on symbolId will save us
export async function hydrateGateKeeper(symbols: SymbolPairSummary[]) {
  await getModel<OrderQueueStatus>('orderQueueStatus').destroy({
    where: { id: { $gte: 1 } },
  })

  const hydratedStatuses = _.map(
    symbols,
    (symbol: SymbolPairSummary): Gate => {
      return { symbolId: symbol.id, processing: false, lastProcessed: new Date() }
    },
  )

  const orderQueueStatuses = await getModel<OrderQueueStatus>('orderQueueStatus').bulkCreate(hydratedStatuses as OrderQueueStatus[])
  return orderQueueStatuses.map(o => o.get())
}
// This function allows us to stop the working from any further processing
export function disableProcessing() {
  logger.warn(`disableProcessing: Disable procesing request received`)
  return new Promise(res => {
    queueEmitter.once(`queueEmitter:shutdown`, res)
    disable = true
    return getModel<OrderQueueStatus>('orderQueueStatus').update(
      {
        processing: true,
        lastProcessed: new Date(),
      } as any,
      { where: {} },
    )
  })
}
export async function initializeGatekeeper() {
  const epicurus = getEpicurusInstance()
  const symbolPairs = await getAllSymbolPairSummaries()

  logger.debug('Adding orders to queue')
  await publishDbOrdersToQueue()

  logger.debug('Hydrating gate keeper')
  await hydrateGateKeeper(symbolPairs)
  logger.debug('Gate keeper hydrated')

  return epicurus.subscribe(OrderPubSubChannels.exchangeOrderEvents, message => {
    const jobId = message.order.jobId
    queueEmitter.emit(`queueEmitter:job:${jobId}`, message.order)
  })
}
