import { expect } from 'chai'
import Decimal from 'decimal.js'
import moment from 'moment'
import sinon from 'sinon'

import { DepthMidPrice, MidPricesForSymbolRequest, MidPricesForSymbolsRequest } from '@abx-types/market-data'
import { sequelize, CacheGateway, wrapInTransaction, getCacheClient, truncateTables } from '@abx/db-connection-utils'
import * as symbols from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { DatabaseMidPriceRepository, CacheFirstMidPriceRepository } from '../../../repository/mid-price'

const symbolId1 = 'KAU_USD'
const symbolId2 = 'KAU_EUR'

describe('CacheFirstMidPriceRepository', () => {
  let cacheFirstMidPriceRepository: CacheFirstMidPriceRepository
  const cacheGateway = getCacheClient()
  const permStorage = new DatabaseMidPriceRepository()

  beforeEach(async () => {
    sinon.restore()
    await truncateTables()

    cacheFirstMidPriceRepository = new CacheFirstMidPriceRepository(cacheGateway, permStorage)
    sinon
      .stub(symbols, 'getAllCompleteSymbolDetails')
      .returns(Promise.resolve([createSymbol(CurrencyCode.kau, CurrencyCode.usd), createSymbol(CurrencyCode.kau, CurrencyCode.euro)]))

    sinon.stub(symbols, 'getSymbolBoundaries').resolves({
      baseBoundary: {
        maxDecimals: 5,
        minAmount: 0.00001,
      },
      quoteBoundary: {
        maxDecimals: 2,
        minAmount: 0.01,
      },
      base: {
        id: 1,
        base: CurrencyCode.kau,
      },
      quote: {
        id: 1,
        base: CurrencyCode.usd,
      },
      fee: {
        id: 1,
        base: CurrencyCode.kau,
      },
    })
  })

  afterEach(async () => {
    sinon.restore()
    await cacheGateway.flush()
  })

  it('recordDepthMidPriceChange should record value both in cache and perm storage', async () => {
    const highestBid = 12.3
    const lowestAsk = 13.1

    await cacheFirstMidPriceRepository.recordDepthMidPriceChange(symbolId1, { price: highestBid, amount: 10 }, { price: lowestAsk, amount: 9 })
    const [midPriceInRedis] = await getAllSymbolDataFromRedisOldestToNewest(cacheGateway, symbolId1)
    expect(midPriceInRedis.price).to.eql((highestBid + lowestAsk) / 2)
    const [midPriceInDb] = await getAllSymbolDataFromDatabaseOldestToNewest(
      permStorage,
      symbolId1,
      moment()
        .subtract(5, 'minutes')
        .toDate(),
    )
    expect(midPriceInDb.price).to.eql((highestBid + lowestAsk) / 2)
  })

  it('recordDepthMidPriceChange should record truncated value both in cache and perm storage', async () => {
    const highestBid = 12.35
    const lowestAsk = 13.18
    // nonTruncatedMidPrice = 12.765
    const nonTruncatedMidPrice = (highestBid + lowestAsk) / 2
    // truncatedMidPrice = 12.76
    const truncatedMidPrice = new Decimal(nonTruncatedMidPrice).toDP(2, Decimal.ROUND_DOWN).toNumber()

    await cacheFirstMidPriceRepository.recordDepthMidPriceChange(symbolId1, { price: highestBid, amount: 10 }, { price: lowestAsk, amount: 9 })
    const [midPriceInRedis] = await getAllSymbolDataFromRedisOldestToNewest(cacheGateway, symbolId1)
    expect(midPriceInRedis.price).to.not.eql(nonTruncatedMidPrice)
    expect(midPriceInRedis.price).to.eql(truncatedMidPrice)
    const [midPriceInDb] = await getAllSymbolDataFromDatabaseOldestToNewest(
      permStorage,
      symbolId1,
      moment()
        .subtract(5, 'minutes')
        .toDate(),
    )
    expect(midPriceInDb.price).to.not.eql(nonTruncatedMidPrice)
    expect(midPriceInDb.price).to.eql(truncatedMidPrice)
  })

  it('recordDepthMidPriceChange should record value when value has not changed in db but only once in redis', async () => {
    const highestBid = 12.3
    const lowestAsk = 13.1

    await cacheFirstMidPriceRepository.recordDepthMidPriceChange(symbolId1, { price: highestBid, amount: 10 }, { price: lowestAsk, amount: 9 })
    await cacheFirstMidPriceRepository.recordDepthMidPriceChange(symbolId1, { price: highestBid, amount: 10 }, { price: lowestAsk, amount: 9 })

    const midPricesInRedis = await getAllSymbolDataFromRedisOldestToNewest(cacheGateway, symbolId1)
    expect(midPricesInRedis[0].price).to.eql((highestBid + lowestAsk) / 2)
    const midPricesInDb = await getAllSymbolDataFromDatabaseOldestToNewest(
      permStorage,
      symbolId1,
      moment()
        .subtract(5, 'minutes')
        .toDate(),
    )
    expect(midPricesInDb[0].price).to.eql((highestBid + lowestAsk) / 2)
    expect(midPricesInDb.length).to.eql(2)
    expect(midPricesInRedis.length).to.eql(1)
  })
  it('getMidPricesForSymbols should get prices for all symbols', async () => {
    await cacheFirstMidPriceRepository.recordDepthMidPriceChange(symbolId1, { price: 10, amount: 1 }, { price: 10, amount: 1 })
    const midPrices = await cacheFirstMidPriceRepository.getMidPricesForSymbol(
      new MidPricesForSymbolRequest(
        symbolId1,
        moment()
          .subtract(5, 'minutes')
          .toDate(),
      ),
    )
    expect(midPrices[0].price).to.eql(10)
    expect(midPrices[0].symbolId).to.eql(symbolId1)
    expect(midPrices.length).to.eql(1)
  })

  it('getMidPricesForSymbol should get prices from db when cache empty and update cache values - also eliminate out of range data', async () => {
    await cacheFirstMidPriceRepository.recordDepthMidPriceChange(symbolId1, { price: 10, amount: 1 }, { price: 10, amount: 1 })
    await cacheGateway.flush() // removed from redis

    const midPricesInRedis = await getAllSymbolDataFromRedisOldestToNewest(cacheGateway, symbolId1)
    expect(midPricesInRedis.length).to.eql(0)

    const midPricesInDb = await getAllSymbolDataFromDatabaseOldestToNewest(
      permStorage,
      symbolId1,
      moment()
        .subtract(5, 'minutes')
        .toDate(),
    )
    expect(midPricesInDb[0].price).to.eql(10)
    expect(midPricesInDb.length).to.eql(1)

    await timeout(1500) // wait 1.5 seconds

    await cacheFirstMidPriceRepository.recordDepthMidPriceChange(symbolId1, { price: 15, amount: 1 }, { price: 10, amount: 1 })
    await cacheGateway.flush() // removed from redis

    const midPricesInRedisTwo = await getAllSymbolDataFromRedisOldestToNewest(cacheGateway, symbolId1)
    expect(midPricesInRedisTwo.length).to.eql(0)

    const midPrices = await cacheFirstMidPriceRepository.getMidPricesForSymbol(
      new MidPricesForSymbolRequest(
        symbolId1,
        moment()
          .subtract(1, 's')
          .toDate(),
      ),
    )
    expect(midPrices.length).to.eql(1)
    expect(midPrices[0].price).to.eql(12.5)
    const midPricesInRedisThree = await getAllSymbolDataFromRedisOldestToNewest(cacheGateway, symbolId1)
    expect(midPricesInRedisThree.length).to.eql(1)
  })

  it('getMidPricesForSymbols should get the prices for all symbols from cache when prices present and not go to db', async () => {
    await cacheFirstMidPriceRepository.recordDepthMidPriceChange(symbolId1, { price: 15, amount: 10 }, { price: 10, amount: 1 })
    await cacheFirstMidPriceRepository.recordDepthMidPriceChange(symbolId2, { price: 20, amount: 10 }, { price: 25, amount: 1 })

    const midPrices = await cacheFirstMidPriceRepository.getMidPricesForSymbols(
      new MidPricesForSymbolsRequest(
        [symbolId1, symbolId2],
        moment()
          .subtract(5, 'minutes')
          .toDate(),
      ),
    )
    expect(midPrices.get(symbolId1)!.length).to.eql(1)
    expect(midPrices.get(symbolId2)!.length).to.eql(1)
    expect(midPrices.get(symbolId1)![0].price).to.eql(12.5)
    expect(midPrices.get(symbolId2)![0].price).to.eql(22.5)
  })

  it('cleanOldMidPrices should clean mid price data created more than 24 hours ago', async () => {
    const trimListStub = sinon.stub().returns(Promise.resolve())
    const cacheGatewayGetListStub = sinon.stub()
    const cacheGatewayStub = {
      getList: cacheGatewayGetListStub,
      trimList: trimListStub,
    } as any
    const cacheFirstMidPriceRepositoryStub = new CacheFirstMidPriceRepository(cacheGatewayStub)

    const cachedSymbol1MidPrices = [
      {
        symbolId1,
        price: 12,
        createdAt: moment()
          .subtract(25, 'hours')
          .toDate(),
      },
      {
        symbolId1,
        price: 10,
        createdAt: moment()
          .subtract(15, 'hours')
          .toDate(),
      },
      {
        symbolId1,
        price: 10,
        createdAt: new Date(),
      },
    ]
    cacheGatewayGetListStub.onFirstCall().returns(cachedSymbol1MidPrices)

    const cachedSymbol2MidPrices = [
      {
        symbolId: symbolId2,
        price: 14,
        createdAt: moment()
          .subtract(25, 'hours')
          .toDate(),
      },
      {
        symbolId: symbolId2,
        price: 12,
        createdAt: moment()
          .subtract(15, 'hours')
          .toDate(),
      },
    ]
    cacheGatewayGetListStub.onSecondCall().returns(cachedSymbol2MidPrices)

    await cacheFirstMidPriceRepositoryStub.cleanOldMidPrices()
    const { args: symbol1TrimArgs } = trimListStub.getCall(0)
    expect(symbol1TrimArgs).to.eql([`exchange:mid-price:${symbolId1}`, 0, 0])

    const { args: symbol2TrimArgs } = trimListStub.getCall(1)
    expect(symbol2TrimArgs).to.eql([`exchange:mid-price:${symbolId2}`, 0, 0])
  })
})

const createSymbol = (base: CurrencyCode, quote: CurrencyCode) => ({
  id: `${base}_${quote}`,
  base: {
    id: 1,
    code: base,
    sortPriority: 1,
    orderPriority: 1,
  },
  quote: {
    id: 2,
    code: quote,
    sortPriority: 2,
    orderPriority: 2,
  },
  fee: {
    id: 3,
    code: base,
    sortPriority: 1,
    orderPriority: 1,
  },
  orderRange: 0.3,
})

const getAllSymbolDataFromRedisOldestToNewest = async (cacheGateway: CacheGateway, symbolId: string) =>
  cacheGateway.getList<DepthMidPrice>(`exchange:mid-price:${symbolId}`)

const getAllSymbolDataFromDatabaseOldestToNewest = async (permStorage: DatabaseMidPriceRepository, symbolId: string, from: Date) =>
  wrapInTransaction(sequelize, null, async tran => permStorage.getMidPricesForSymbol({ symbolId, from, limit: 10, transaction: tran }))

const timeout = async ms => new Promise(resolve => setTimeout(resolve, ms))
