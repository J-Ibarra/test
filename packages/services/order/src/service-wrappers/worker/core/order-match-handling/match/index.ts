import newrelic from 'newrelic'
import { OrderModuleState, OrderQueueRequest } from '@abx-types/order'
import { OrderCancellationHandler } from '../cancellation'
import performOrderMatch from './matcher'
import { getDepthFromCache, setDepthIntoRedis } from '../depth/redis'

export async function processOrderRequest(state: OrderModuleState, request: OrderQueueRequest): Promise<{ error?: Error; order }> {
  const transaction = (newrelic as any).createWebTransaction('process:' + request.requestType, async () => {
    const symbolId = request.order.symbolId

    // Load depth into memory from redis so that we can deal with it syncronously
    state.depth.orders[symbolId] = await getDepthFromCache(symbolId)

    if (request.order) {
      request.order = {
        ...request.order,
        createdAt: new Date(request.order.createdAt!),
      }
    }

    const requestType = {
      async place() {
        return saveDepthBeforeDone(() => performOrderMatch(state, request.order), symbolId, state.depth.orders[symbolId], request)
      },
      cancel() {
        return saveDepthBeforeDone(
          () => OrderCancellationHandler.getInstance().handleOrderCancellation(state, request.order, request.cancellationReason!),
          symbolId,
          state.depth.orders[symbolId],
          request,
        )
      },
    }

    return requestType[request.requestType]()
  })

  return transaction()
}

async function saveDepthBeforeDone(performAction, symbolId, depthOrdersForSymbol, request) {
  try {
    const result = await performAction()

    await setDepthIntoRedis(symbolId, depthOrdersForSymbol)

    result.jobId = request.jobId
    newrelic.endTransaction()

    return {
      error: null,
      order: result,
    }
  } catch (e) {
    newrelic.endTransaction()

    return {
      error: e,
      order: {
        jobId: request.jobId,
      },
    }
  }
}
