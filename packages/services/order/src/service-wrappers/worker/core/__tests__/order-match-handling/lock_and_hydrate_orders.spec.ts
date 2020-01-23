import { expect } from 'chai'
import sinon from 'sinon'
import { getCacheClient, CacheGateway, truncateTables } from '@abx-utils/db-connection-utils'
import { OrderDirection, OrderStatus, OrderQueueRequest } from '@abx-types/order'
import { createOrder as persistOrderInDb } from '../../../../../core'
import { createOrder } from './test-utils'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import { publishDbOrdersToQueue } from '../../order-match-handling/lock_and_hydrate_orders'
import { setDepthIntoRedis } from '../../order-match-handling/depth/redis'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'

describe.skip('lock_and_hydrate_order:integration', () => {
  let testAccount
  let redisCacheGateway: CacheGateway
  const kauUsd = 'KAU_USD'
  before(() => {
    redisCacheGateway = getCacheClient()
  })

  beforeEach(async () => {
    testAccount = await createTemporaryTestingAccount()
    await redisCacheGateway.flush()
    sinon.stub(referenceDataOperations, 'getAllSymbolPairSummaries').resolves([
      {
        id: 'KAU_USD',
        base: {
          code: CurrencyCode.kau,
        },
        quote: {
          base: {
            code: CurrencyCode.usd,
          },
        },
      },
    ])
  })

  afterEach(async () => {
    await truncateTables()
    sinon.restore()
  })

  describe('publishDbOrdersToQueue', () => {
    it('should add order requests to queue for all submit partialFill and pendingCancelOrders', async () => {
      let submitOrder = await createOrder({
        orderId: 1,
        accountId: testAccount.id,
        symbolId: kauUsd,
        direction: OrderDirection.sell,
        status: OrderStatus.submit,
      })
      let partialFillOrder = await createOrder({
        orderId: 2,
        accountId: testAccount.id,
        status: OrderStatus.partialFill,
        symbolId: kauUsd,
        direction: OrderDirection.sell,
      })
      let pendingCancelOrder = await createOrder({
        orderId: 3,
        accountId: testAccount.id,
        status: OrderStatus.pendingCancel,
        symbolId: kauUsd,
        direction: OrderDirection.buy,
      })

      submitOrder = await persistOrderInDb(submitOrder)
      partialFillOrder = await persistOrderInDb(partialFillOrder)
      pendingCancelOrder = await persistOrderInDb(pendingCancelOrder)

      await publishDbOrdersToQueue()

      const cancelOrderRequest = await redisCacheGateway.popLastElement<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)
      expect(cancelOrderRequest.order.id).to.eql(pendingCancelOrder.id)

      const submitOrderRequest = await redisCacheGateway.popLastElement<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)
      expect(submitOrderRequest.order.id).to.eql(submitOrder.id)

      const partialFillOrderRequest = await redisCacheGateway.popLastElement<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)
      expect(partialFillOrderRequest.order.id).to.eql(partialFillOrder.id)
    }).timeout(15_000)

    it('should not add order requests to queue for all fill and cancel orders', async () => {
      let cancelledOrders = await createOrder({
        orderId: 1,
        accountId: testAccount.id,
        symbolId: kauUsd,
        direction: OrderDirection.sell,
        status: OrderStatus.cancel,
      })
      let filledOrder = await createOrder({
        orderId: 2,
        accountId: testAccount.id,
        status: OrderStatus.fill,
        symbolId: kauUsd,
        direction: OrderDirection.sell,
      })
      cancelledOrders = await persistOrderInDb(cancelledOrders)
      filledOrder = await persistOrderInDb(filledOrder)

      await publishDbOrdersToQueue()
      const allOrderRequests = await redisCacheGateway.getList<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)
      expect(allOrderRequests.length).to.eql(0)
    }).timeout(15_000)

    it('should not create order requests for orders where order requests already exist on the queue', async () => {
      let submitOrder = await createOrder({
        orderId: 1,
        accountId: testAccount.id,
        symbolId: kauUsd,
        direction: OrderDirection.sell,
        status: OrderStatus.submit,
      })
      let partialFillOrder = await createOrder({
        orderId: 2,
        accountId: testAccount.id,
        status: OrderStatus.partialFill,
        symbolId: kauUsd,
        direction: OrderDirection.sell,
      })
      let pendingCancelOrder = await createOrder({
        orderId: 3,
        accountId: testAccount.id,
        status: OrderStatus.pendingCancel,
        symbolId: kauUsd,
        direction: OrderDirection.buy,
      })

      await redisCacheGateway.addValueToHeadOfList<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`, {
        requestType: 'place',
        order: partialFillOrder,
      })

      submitOrder = await persistOrderInDb(submitOrder)
      partialFillOrder = await persistOrderInDb(partialFillOrder)
      pendingCancelOrder = await persistOrderInDb(pendingCancelOrder)

      await publishDbOrdersToQueue()

      const orderRequests = await redisCacheGateway.getList<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)

      expect(orderRequests.length).to.eql(3)

      const partialFillOrderRequest = await redisCacheGateway.popLastElement<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)
      expect(partialFillOrderRequest.order.id).to.eql(partialFillOrder.id)

      const cancelOrderRequest = await redisCacheGateway.popLastElement<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)
      expect(cancelOrderRequest.order.id).to.eql(pendingCancelOrder.id)

      const submitOrderRequest = await redisCacheGateway.popLastElement<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)
      expect(submitOrderRequest.order.id).to.eql(submitOrder.id)
    }).timeout(15_000)

    it('should not create order requests for orders where order requests already exist on the queue single order', async () => {
      let submitOrder = await createOrder({
        orderId: 1,
        accountId: testAccount.id,
        symbolId: kauUsd,
        direction: OrderDirection.sell,
        status: OrderStatus.submit,
      })

      await redisCacheGateway.addValueToHeadOfList<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`, {
        requestType: 'place',
        order: submitOrder,
      })

      submitOrder = await persistOrderInDb(submitOrder)

      await publishDbOrdersToQueue()

      const orderRequests = await redisCacheGateway.getList<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)

      expect(orderRequests.length).to.eql(1)

      const submitOrderRequest = await redisCacheGateway.popLastElement<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)
      expect(submitOrderRequest.order.id).to.eql(submitOrder.id)
    }).timeout(15_000)

    it('should not create order requests for orders that are on the depth', async () => {
      let submitOrder = await createOrder({
        orderId: 1,
        accountId: testAccount.id,
        symbolId: kauUsd,
        direction: OrderDirection.sell,
        status: OrderStatus.submit,
      })

      await setDepthIntoRedis(kauUsd, {
        [OrderDirection.sell]: [submitOrder],
        [OrderDirection.buy]: [],
      } as any)

      submitOrder = await persistOrderInDb(submitOrder)

      await publishDbOrdersToQueue()

      const orderRequests = await redisCacheGateway.getList<OrderQueueRequest>(`exchange:orders:queue:${kauUsd}`)

      expect(orderRequests.length).to.eql(0)
    }).timeout(15_000)
  })
})
