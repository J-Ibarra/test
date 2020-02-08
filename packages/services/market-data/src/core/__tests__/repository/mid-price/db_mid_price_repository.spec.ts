import { expect } from 'chai'
import moment from 'moment'
import sinon from 'sinon'

import { getModel, truncateTables } from '@abx-utils/db-connection-utils'
import { DepthMidPrice, MidPricesForSymbolRequest, MidPricesForSymbolsRequest } from '@abx-types/market-data'
import { DatabaseMidPriceRepository } from '../../../repository/mid-price/db_mid_price_repository'
import * as symbols from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'

const symbolId = 'KAU_USD'

describe('DatabaseMidPriceRepository', () => {
  const databaseMidPriceRepository = new DatabaseMidPriceRepository()

  beforeEach(async () => {
    await truncateTables()

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

  afterEach(() => sinon.restore())

  it('recordDepthMidPriceChange should calculate mid price and create a new mid-price entry', async () => {
    const highestBid = 12.3
    const lowestAsk = 13.1

    await databaseMidPriceRepository.recordDepthMidPriceChange(
      symbolId,
      { price: highestBid, amount: 10 },
      {
        price: lowestAsk,
        amount: 9,
      },
    )

    const midPriceRecorded = await getModel<DepthMidPrice>('depth_mid_price').findOne({ where: { symbolId } })
    const result = midPriceRecorded!.get()

    expect(result.price).to.eql((highestBid + lowestAsk) / 2)
    expect(result.symbolId).to.eql(symbolId)
    // tslint:disable-next-line:no-unused-expression
    expect(result.symbolId).to.not.be.null
  })

  it('getMidPricesForSymbol should retrieve all the mid prices for a given symbol from a given point in time', async () => {
    const midPricesOutsideOfTimeBoundary = [
      {
        id: 1,
        symbolId,
        price: 4,
        createdAt: moment()
          .subtract('8', 'hours')
          .toDate(),
        updatedAt: moment()
          .subtract('8', 'hours')
          .toDate(),
      },
      {
        id: 2,
        symbolId,
        price: 1,
        createdAt: moment()
          .subtract('7', 'hours')
          .toDate(),
        updatedAt: moment()
          .subtract('7', 'hours')
          .toDate(),
      },
    ]
    const midPricesInTimeBoundary = [
      {
        id: 3,
        symbolId,
        price: 3,
        createdAt: moment()
          .subtract('4', 'hours')
          .toDate(),
        updatedAt: moment()
          .subtract('4', 'hours')
          .toDate(),
      },
      {
        id: 4,
        symbolId,
        price: 20,
        createdAt: moment()
          .subtract('2', 'hours')
          .toDate(),
        updatedAt: moment()
          .subtract('2', 'hours')
          .toDate(),
      },
    ]

    await getModel<DepthMidPrice>('depth_mid_price').bulkCreate([...midPricesInTimeBoundary, ...midPricesOutsideOfTimeBoundary])

    const retrievedMidPrices = await databaseMidPriceRepository.getMidPricesForSymbol(
      new MidPricesForSymbolRequest(
        symbolId,
        moment()
          .subtract('6', 'hours')
          .toDate(),
      ),
    )
    expect(retrievedMidPrices.length).to.eql(2)
    expect(retrievedMidPrices[0]).to.eql(midPricesInTimeBoundary[0])
    expect(retrievedMidPrices[1]).to.eql(midPricesInTimeBoundary[1])
  })

  it('getMidPricesForSymbols should retrieve all the mid prices for all symbols from a given time frame', async () => {
    const symbolId2 = 'KAG_USD'
    const symbol1MidPrices = [
      {
        id: 1,
        symbolId,
        price: 4,
        createdAt: moment()
          .subtract('2', 'hours')
          .toDate(),
        updatedAt: moment()
          .subtract('2', 'hours')
          .toDate(),
      },
      {
        id: 2,
        symbolId,
        price: 1,
        createdAt: moment()
          .subtract('1', 'hours')
          .toDate(),
        updatedAt: moment()
          .subtract('1', 'hours')
          .toDate(),
      },
    ]
    const symbol2MidPrices = [
      {
        id: 3,
        symbolId: symbolId2,
        price: 4,
        createdAt: moment()
          .subtract('2', 'hours')
          .toDate(),
        updatedAt: moment()
          .subtract('2', 'hours')
          .toDate(),
      },
      {
        id: 4,
        symbolId: symbolId2,
        price: 1,
        createdAt: moment()
          .subtract('1', 'hours')
          .toDate(),
        updatedAt: moment()
          .subtract('1', 'hours')
          .toDate(),
      },
    ]

    await getModel<DepthMidPrice>('depth_mid_price').bulkCreate([...symbol1MidPrices, ...symbol2MidPrices])

    const retrievedMidPrices = await databaseMidPriceRepository.getMidPricesForSymbols(
      new MidPricesForSymbolsRequest(
        [symbolId, symbolId2],
        moment()
          .subtract('6', 'hours')
          .toDate(),
      ),
    )

    expect(retrievedMidPrices.size).to.eql(2)
    expect(retrievedMidPrices.get(symbolId)).to.eql([symbol1MidPrices[0], symbol1MidPrices[1]])
    expect(retrievedMidPrices.get(symbolId2)).to.eql([symbol2MidPrices[0], symbol2MidPrices[1]])
  })
})
