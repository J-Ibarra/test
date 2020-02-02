import { expect } from 'chai'
import moment from 'moment'
import sinon from 'sinon'
import request from 'supertest'
import { getModel } from '@abx/db-connection-utils'
import { MarketDataTimeFrame, OHLCMarketData } from '@abx-types/market-data'
import * as realTimeMidPriceCalculator from '@abx-service-clients/market-data'
import { bootstrapRestApi as bootstrapApi, MARKET_DATA_REST_API_PORT } from '..'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

describe('api:market-data', () => {
  let app
  const symbolId = 'KAU_USD'

  beforeEach(async () => {
    app = bootstrapApi().listen(MARKET_DATA_REST_API_PORT)
    sinon.stub(referenceDataOperations, 'getAllSymbolPairSummaries').resolves([
      {
        id: symbolId,
      },
    ])
  })

  afterEach(async () => {
    sinon.restore()
    await app.close()
  })

  it('getMarketData should return all the OLHC market data', async () => {
    const mockMidPrice = 50
    sinon.stub(realTimeMidPriceCalculator, 'calculateRealTimeMidPriceForSymbol').resolves(mockMidPrice)

    const timeFrame = MarketDataTimeFrame.fiveMinutes
    const recordedOHLCMarketData = await setupOHLCData(symbolId)

    const { body: ohlcMarketData, status } = await request(app)
      .get('/api/market-data/ohlc')
      .query({
        symbolId,
        timeFrame,
        fromDate: moment()
          .subtract('1', 'hours')
          .format('YYYY-MM-DDTHH:mm:ss'),
      })
      .set('Accept', 'application/json')

    const realtimeData = {
      symbolId,
      open: recordedOHLCMarketData[1].close,
      close: mockMidPrice,
      high: mockMidPrice,
      low: recordedOHLCMarketData[1].close,
      createdAt: ohlcMarketData[2].createdAt,
    }
    expect(status).to.eql(200)

    expect(ohlcMarketData.length).to.eql(3)
    verifyRetrievedOHLCMatchesExpected(ohlcMarketData[0], recordedOHLCMarketData[0])
    verifyRetrievedOHLCMatchesExpected(ohlcMarketData[1], recordedOHLCMarketData[1])
    verifyRetrievedOHLCMatchesExpected(ohlcMarketData[2], realtimeData)
  })
})

function verifyRetrievedOHLCMatchesExpected(retrievedOHLCData, epxectedOHLCData) {
  expect(retrievedOHLCData.symbolId).to.eql(epxectedOHLCData.symbolId)
  expect(retrievedOHLCData.open).to.eql(epxectedOHLCData.open)
  expect(retrievedOHLCData.high).to.eql(epxectedOHLCData.high)
  expect(retrievedOHLCData.low).to.eql(epxectedOHLCData.low)
  expect(retrievedOHLCData.close).to.eql(epxectedOHLCData.close)
}

async function setupOHLCData(symbolId: string) {
  const ohlcMarketData = [
    {
      id: 1,
      symbolId,
      open: 10,
      high: 15,
      low: 7,
      close: 18,
      timeFrame: MarketDataTimeFrame.fiveMinutes,
      createdAt: moment()
        .subtract('10', 'minutes')
        .toDate(),
    },
    {
      id: 2,
      symbolId,
      open: 10,
      high: 16,
      low: 3,
      close: 12,
      timeFrame: MarketDataTimeFrame.fiveMinutes,
      createdAt: new Date(),
    },
  ]

  await getModel<OHLCMarketData>('ohlc_market_data').bulkCreate(ohlcMarketData)

  return ohlcMarketData
}
