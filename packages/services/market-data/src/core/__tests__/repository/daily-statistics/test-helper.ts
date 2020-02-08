import moment from 'moment'
import sinon from 'sinon'
import { getModel, MemoryCache } from '@abx-utils/db-connection-utils'
import { OrderDirection, OrderMatchStatus } from '@abx-types/order'
import { DepthMidPrice } from '@abx-types/market-data'
import { initialisePriceChangeStatistics } from '../../../repository'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as orderOperations from '@abx-service-clients/order'

export async function initialiseRedis({
  testAccount,
  testAccountTwo,
  symbolId,
  addToDepth = true,
}: {
  testAccount: Account
  testAccountTwo: Account
  symbolId: string
  addToDepth?: boolean
}) {
  const buyOrder = {
    id: 1,
    accountId: testAccount.id,
    symbolId,
    direction: OrderDirection.buy,
    remaining: 10,
    limitPrice: 20,
    amount: 10,
  }
  const sellOrder = {
    id: 2,
    accountId: testAccountTwo.id,
    symbolId,
    direction: OrderDirection.sell,
    remaining: 30,
    limitPrice: 25,
    amount: 30,
  }

  const midPricesInTimeBoundary = [
    {
      id: 3,
      symbolId,

      price: 22,
      createdAt: moment()
        .subtract('7', 'hours')
        .toDate(),
      updatedAt: moment()
        .subtract('7', 'hours')
        .toDate(),
    },
    {
      id: 4,
      symbolId,
      price: 21,
      createdAt: moment()
        .subtract('2', 'hours')
        .toDate(),
      updatedAt: moment()
        .subtract('2', 'hours')
        .toDate(),
    },
  ]
  const midPricesOutsideOfTimeBoundary = [
    {
      id: 1,
      symbolId,
      price: 20,
      createdAt: moment()
        .subtract('25', 'hours')
        .toDate(),
      updatedAt: moment()
        .subtract('25', 'hours')
        .toDate(),
    },
    {
      id: 2,
      symbolId,
      price: 27,
      createdAt: moment()
        .subtract('25', 'hours')
        .toDate(),
      updatedAt: moment()
        .subtract('25', 'hours')
        .toDate(),
    },
  ]

  await getModel<DepthMidPrice>('depth_mid_price').bulkCreate([...midPricesInTimeBoundary, ...midPricesOutsideOfTimeBoundary])
  const orderMatch = {
    buyAccountId: testAccountTwo.id,
    sellAccountId: testAccount.id,
    symbolId,
    amount: 15,
    matchPrice: 20,
    status: OrderMatchStatus.settled,
  }

  if (addToDepth) {
    sinon.stub(referenceDataOperations, 'getAllCompleteSymbolDetails').resolves([{ id: symbolId }])
    sinon.stub(orderOperations, 'findOrderMatches').resolves([orderMatch])
    sinon
      .stub(orderOperations, 'getOpenOrders')
      .withArgs(symbolId, OrderDirection.buy, 1)
      .resolves([buyOrder])
      .withArgs(symbolId, OrderDirection.sell, 1)
      .resolves([sellOrder])
    await initialisePriceChangeStatistics()
  }
}

export const setupMemoryCache = (symbol: string) => {
  MemoryCache.getInstance().set({ key: `exchange:stats:change:${symbol}:1`, val: 34 })
  MemoryCache.getInstance().set({ key: `exchange:stats:change:${symbol}:2`, val: 47 })
  MemoryCache.getInstance().set({ key: `exchange:stats:change:${symbol}:3`, val: 48 })
  MemoryCache.getInstance().set({ key: `exchange:stats:change:${symbol}:4`, val: 32 })
}
