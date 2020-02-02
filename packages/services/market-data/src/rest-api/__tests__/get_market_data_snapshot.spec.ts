import { expect } from 'chai'
import request from 'supertest'
import { MemoryCache, truncateTables, getCacheClient } from '@abx/db-connection-utils'
import { CacheFirstMidPriceRepository, MidPriceRepository, initialisePriceChangeStatistics } from '../../core'
import { Order, OrderDirection, OrderMatchStatus, OrderStatus, OrderType, OrderValidity, SymbolDepth } from '@abx-types/order'
import { CurrencyCode } from '@abx-types/reference-data'
import { bootstrapRestApi as bootstrapApi, MARKET_DATA_REST_API_PORT } from '..'
import * as orderOperations from '@abx-service-clients/order'
import { createTemporaryTestingAccount, createAccountAndSession } from '@abx-utils/account'
import sinon from 'sinon'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

let kauUsdTransactionBuyOrderId
let kauUsdTransactionSellOrderId
let kvtUsdTransactionBuyOrderId
let kvtUsdTransactionSellOrderId
let testBuyAccountId
let testSellAccountId
const kauUsdSymbol = 'KAU_USD'
const kvtUsdSymbol = 'KVT_USD'
const depthPrefix = 'exchange:symbol:depth:'

describe('api:market-data', () => {
  let app
  let orders
  before(async () => {
    await getCacheClient().flush()
    await MemoryCache.getInstance().flush()
  })

  beforeEach(async () => {
    app = bootstrapApi().listen(MARKET_DATA_REST_API_PORT)
    await truncateTables()
    testBuyAccountId = (await createTemporaryTestingAccount()).id
    testSellAccountId = (await createTemporaryTestingAccount()).id

    sinon.stub(referenceDataOperations, 'getSymbolBoundaries').resolves({
      baseBoundary: {
        maxDecimals: 5,
        minAmount: 0.00001,
      },
      quoteBoundary: {
        maxDecimals: 5,
        minAmount: 0.00001,
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
    orders = await Promise.all([
      createOrder(10, 10, testBuyAccountId, OrderDirection.buy),
      createOrder(10, 12, testSellAccountId, OrderDirection.sell),
      createOrder(10, 10, testBuyAccountId, OrderDirection.buy, kvtUsdSymbol),
      createOrder(10, 10, testSellAccountId, OrderDirection.sell, kvtUsdSymbol),
    ])

    kauUsdTransactionBuyOrderId = orders[0].id
    kauUsdTransactionSellOrderId = orders[1].id
    kvtUsdTransactionBuyOrderId = orders[2].id
    kvtUsdTransactionSellOrderId = orders[3].id

    sinon.stub(orderOperations, 'getOpenOrders').resolves(orders)
    sinon.stub(referenceDataOperations, 'getAllSymbolPairSummaries').resolves([{ id: 'KVT_USD' }])
    sinon.stub(referenceDataOperations, 'getAllSymbolsIncludingCurrency').resolves([
      {
        id: 'KVT_USD',
      },
    ])
    sinon.stub(referenceDataOperations, 'getAllCompleteSymbolDetails').resolves([{ id: 'KVT_USD' }])
  })

  afterEach(async () => {
    await app.close()
    await getCacheClient().flush()
    await MemoryCache.getInstance().flush()
    sinon.restore()
  })

  it('getMarketDataSnapshotForCurrency should return the market data snapshot', async () => {
    const latestBuyPrice = 10
    const latestSellPrice = 11
    const orderMatchAmount = 10
    const { cookie } = await createAccountAndSession()
    await setupMidPriceRepository(CacheFirstMidPriceRepository.getInstance(), latestBuyPrice, latestSellPrice)
    await setupDepth(latestBuyPrice, latestSellPrice)

    await createAnOrderMatch(orderMatchAmount)
    await initialisePriceChangeStatistics()

    const { body: ohlcMarketData, status } = await request(app)
      .get(`/api/market-data/snapshots/${CurrencyCode.kvt}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookie)

    expect(status).to.eql(200)

    expect(ohlcMarketData.length).to.eql(1)
    expect(ohlcMarketData.find(({ symbolId }) => symbolId === kvtUsdSymbol)).to.eql({
      symbolId: kvtUsdSymbol,
      askPrice: 10,
      bidPrice: 10,
      dailyChange: 10.5,
      dailyVolume: 105,
    })
  })

  it('/market-data/snapshots/all should return the market data snapshot for all symbols', async () => {
    const latestBuyPrice = 10
    const latestSellPrice = 11
    const orderMatchAmount = 10
    const { cookie } = await createAccountAndSession()
    await setupMidPriceRepository(CacheFirstMidPriceRepository.getInstance(), latestBuyPrice, latestSellPrice)
    await setupDepth(latestBuyPrice, latestSellPrice)

    await createAnOrderMatch(orderMatchAmount)
    await initialisePriceChangeStatistics()

    const { body: ohlcMarketData, status } = await request(app)
      .get(`/api/market-data/snapshots/all`)
      .set('Accept', 'application/json')
      .set('Cookie', cookie)

    expect(status).to.eql(200)

    expect(ohlcMarketData.length).to.eql(1)
    expect(ohlcMarketData.find(({ symbolId }) => symbolId === kvtUsdSymbol)).to.eql({
      symbolId: kvtUsdSymbol,
      askPrice: 10,
      bidPrice: 10,
      dailyChange: 10.5,
      dailyVolume: 105,
    })
  })

  it('getMarketDataSnapshotForCurrency should return the market data snapshot when mid prices not present in cache(from db)', async () => {
    const latestBuyPrice = 10
    const latestSellPrice = 11
    const orderMatchAmount = 10
    const { cookie } = await createAccountAndSession()
    await setupMidPriceRepository(CacheFirstMidPriceRepository.getInstance(), latestBuyPrice, latestSellPrice)
    await setupDepth(latestBuyPrice, latestSellPrice)

    await createAnOrderMatch(orderMatchAmount)
    await initialisePriceChangeStatistics()

    const { body: ohlcMarketData, status } = await request(app)
      .get(`/api/market-data/snapshots/${CurrencyCode.kau}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookie)

    expect(status).to.eql(200)

    expect(ohlcMarketData.length).to.eql(1)
    expect(ohlcMarketData.find(({ symbolId }) => symbolId === kvtUsdSymbol)).to.eql({
      symbolId: kvtUsdSymbol,
      askPrice: 10,
      bidPrice: 10,
      dailyChange: 10.5,
      dailyVolume: 105,
    })
  }).timeout(60_000)
})

const setupMidPriceRepository = async (midPriceRepository: MidPriceRepository, latestBuyPrice: number, latestSellPrice: number): Promise<void> => {
  await midPriceRepository.recordDepthMidPriceChange(kauUsdSymbol, { price: 2, amount: 1 }, { price: 4, amount: 1 })
  await midPriceRepository.recordDepthMidPriceChange(kauUsdSymbol, { price: 4, amount: 1 }, { price: 6, amount: 1 })
  await midPriceRepository.recordDepthMidPriceChange(kvtUsdSymbol, { price: latestBuyPrice, amount: 1 }, { price: latestSellPrice, amount: 1 })
}

const setupDepth = async (latestBuyPrice: number, latestSellPrice: number): Promise<Order[]> => {
  const buyDepthOrder = await createOrder(10, latestBuyPrice, testBuyAccountId, OrderDirection.buy)
  const sellDepthOrder = await createOrder(10, latestSellPrice, testSellAccountId, OrderDirection.sell)

  getCacheClient().set<SymbolDepth>(`${depthPrefix}${kauUsdSymbol}`, {
    [OrderDirection.buy]: [buyDepthOrder],
    [OrderDirection.sell]: [sellDepthOrder],
  })

  return [sellDepthOrder, buyDepthOrder]
}

const createOrder = (amount: number, price: number, accountId: string, direction: OrderDirection, symbolId = kauUsdSymbol): Promise<Order> => {
  const order = {
    accountId,
    symbolId,
    direction,
    amount,
    remaining: 5,
    status: OrderStatus.submit,
    orderType: OrderType.limit,
    validity: OrderValidity.GTD,
    limitPrice: price,
  }
  return order as any
}

const createAnOrderMatch = async (orderMatchAmount: number) => {
  sinon.stub(orderOperations, 'findOrderMatches').resolves([
    {
      symbolId: kvtUsdSymbol,
      amount: orderMatchAmount,
      matchPrice: 12.5,
      consideration: 125,
      sellAccountId: testSellAccountId,
      sellOrderId: kvtUsdTransactionSellOrderId,
      sellOrderType: OrderType.limit,
      buyAccountId: testBuyAccountId,
      buyOrderId: kvtUsdTransactionBuyOrderId,
      buyOrderType: OrderType.limit,
      status: OrderMatchStatus.settled,
    },
    {
      symbolId: kauUsdSymbol,
      amount: orderMatchAmount,
      matchPrice: 12.5,
      consideration: 1,
      sellAccountId: testSellAccountId,
      sellOrderId: kauUsdTransactionSellOrderId,
      sellOrderType: OrderType.limit,
      buyAccountId: testBuyAccountId,
      buyOrderId: kauUsdTransactionBuyOrderId,
      buyOrderType: OrderType.limit,
      status: OrderMatchStatus.settled,
    },
  ])
}
