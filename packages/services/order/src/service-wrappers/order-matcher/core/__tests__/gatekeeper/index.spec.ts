const expect = require('chai').expect
import { sequelize, CacheGateway, getCacheClient, getVanillaRedisClient } from '@abx-utils/db-connection-utils'
import { Order, OrderDirection, OrderStatus, OrderType, OrderValidity, OrderQueueRequest } from '@abx-types/order'
import { SymbolPairSummary } from '@abx-types/reference-data'
import { addToQueue, hydrateGateKeeper, initializeGatekeeper, processContract, resetGate } from '../../gatekeeper'
import { Gate } from '../../gatekeeper/model'
import sinon from 'sinon'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

// We need a custom client so we can unsubscribe for spec purposes
const redisSub = getVanillaRedisClient()
let redisClient: CacheGateway
const symbols = [
  {
    id: 'KAU_USD',
  },
  {
    id: 'KAG_USD',
  },
  {
    id: 'KVT_USD',
  },
  {
    id: 'KVT_KAG',
  },
  {
    id: 'KVT_KAU',
  },
  {
    id: 'KVT_EUR',
  },
] as any

describe('gatekeeper', () => {
  before(() => {
    redisClient = getCacheClient()
    sinon.stub(referenceDataOperations, 'getAllSymbolPairSummaries').resolves(symbols)
  })

  after(async () => {
    await hydrateGateKeeper(symbols)
    sinon.restore()
  })

  describe('resetGate', () => {
    let fixedDate

    beforeEach(async () => {
      fixedDate = new Date('01/01/2015')
      const gates: Gate[] = [
        { symbolId: 'KAU_USD', processing: true, lastProcessed: fixedDate },
        { symbolId: 'KAG_USD', processing: true, lastProcessed: fixedDate },
        { symbolId: 'KVT_USD', processing: true, lastProcessed: fixedDate },
      ]

      await sequelize.models.orderQueueStatus.bulkCreate(gates)
    })

    it('correctly sets the contract to processable', async () => {
      await resetGate('KVT_USD')
      const gate = await sequelize.models.orderQueueStatus.findOne({ where: { symbolId: 'KVT_USD' } })
      expect(gate.processing).to.eql(false)
      expect(gate.lastProcessed).to.not.eql(fixedDate)
    })
  })

  describe('addToQueue', () => {
    let orderRequest: OrderQueueRequest
    let order: Order
    let fixedDate

    beforeEach(async () => {
      await redisClient.flush()

      await initializeGatekeeper()
      fixedDate = new Date('01/01/2015')

      const gates: Gate[] = [
        { symbolId: 'KAU_USD', processing: true, lastProcessed: fixedDate },
        { symbolId: 'KAG_USD', processing: true, lastProcessed: fixedDate },
        { symbolId: 'KVT_USD', processing: true, lastProcessed: fixedDate },
      ]

      await sequelize.models.orderQueueStatus.bulkCreate(gates)
    })

    it('adds an item to the correct list in redis', async () => {
      const symbolId = 'KAU_USD'
      order = {
        id: 1,
        accountId: 'accountId',
        symbolId,
        direction: OrderDirection.buy,
        amount: 1,
        remaining: 1,
        status: OrderStatus.submit,
        validity: OrderValidity.GTC,
        orderType: OrderType.market,
      }

      orderRequest = {
        requestType: 'place',
        order,
      }

      addToQueue(symbolId, orderRequest).then(async () => {
        const queueItem = await redisClient.popLastElement<OrderQueueRequest>(`exchange:orders:queue:${symbolId}`)
        expect(queueItem.jobId).to.eql(orderRequest.jobId)
      })

      order.jobId = orderRequest.jobId

      await redisClient.publish('exchange:orders:events', orderRequest)
    })

    it('resolves a queue item based on an assigned jobId', async () => {
      order = {
        id: 1,
        accountId: 'accountId',
        symbolId: 'KAU_USD',
        direction: OrderDirection.buy,
        amount: 1,
        remaining: 1,
        status: OrderStatus.submit,
        validity: OrderValidity.GTC,
        orderType: OrderType.market,
      }

      orderRequest = {
        requestType: 'update',
        order,
      }

      addToQueue('KAU_USD', orderRequest).then(message => {
        expect(message.id).to.eql(order.id)
      })

      order.jobId = orderRequest.jobId

      await redisClient.publish('exchange:orders:events', orderRequest)
    })
  })

  describe('processContract', () => {
    let fixedDate
    let orderRequestFn
    let order
    let orderRequest
    const symbolId = 'KAG_USD'

    beforeEach(async () => {
      await redisClient.flush()
      await initializeGatekeeper()

      fixedDate = new Date('01/01/2015')
      const gates: Gate[] = [
        { symbolId: 'KAU_USD', processing: true, lastProcessed: fixedDate },
        { symbolId: 'KAG_USD', processing: true, lastProcessed: fixedDate },
        { symbolId: 'KVT_USD', processing: true, lastProcessed: fixedDate },
      ]

      await sequelize.models.orderQueueStatus.bulkCreate(gates)

      order = {
        id: 3,
        accountId: 'accountId',
        symbolId,
        direction: OrderDirection.buy,
        amount: 5,
        remaining: 1,
        status: OrderStatus.submit,
        validity: OrderValidity.GTC,
        orderType: OrderType.market,
        jobId: 'stars',
      }

      orderRequest = {
        requestType: 'place',
        order,
      }

      orderRequestFn = (_, cb) => cb(null, orderRequest)
    })

    it('pops a request from the correct queue and publishes an event when processed', async () => {
      await redisClient.addValueToHeadOfList(`exchange:orders:queue:${symbolId}`, orderRequest)
      redisSub.on('message', message => {
        expect(message).to.eql('exchange:orders:events')
        redisSub.unsubscribe('exchange:orders:events')
      })

      redisSub.subscribe('exchange:orders:events')

      processContract(symbolId, orderRequestFn)
    })
  })

  describe('hydrateGateKeeper', () => {
    it('correctly hydrates the order_queue_status table', async () => {
      const symbols: SymbolPairSummary[] = [
        {
          id: 'KVT_EUR',
          baseId: 1,
          quoteId: 2,
          feeId: 2,
          orderRange: 0.3,
        },
        {
          id: 'KVT_KAU',
          baseId: 4,
          quoteId: 6,
          feeId: 6,
          orderRange: 0.3,
        },
        {
          id: 'KVT_KAG',
          baseId: 5,
          quoteId: 7,
          feeId: 7,
          orderRange: 0.3,
        },
      ]

      const fixedDate = new Date('01/01/2015')
      const gates: Gate[] = [
        { symbolId: 'KAU_USD', processing: true, lastProcessed: fixedDate },
        { symbolId: 'KAG_USD', processing: true, lastProcessed: fixedDate },
        { symbolId: 'KVT_USD', processing: true, lastProcessed: fixedDate },
      ]

      await sequelize.models.orderQueueStatus.bulkCreate(gates)
      await hydrateGateKeeper(symbols)
      const newGates = await sequelize.models.orderQueueStatus.findAll()

      expect(newGates.length).to.eql(3)
      expect(newGates[0].symbolId).to.eql('KVT_EUR')
      expect(newGates[0].processing).to.eql(false)
      expect(newGates[1].symbolId).to.eql('KVT_KAU')
      expect(newGates[1].processing).to.eql(false)
      expect(newGates[2].symbolId).to.eql('KVT_KAG')
      expect(newGates[2].processing).to.eql(false)
    })
  })
})
