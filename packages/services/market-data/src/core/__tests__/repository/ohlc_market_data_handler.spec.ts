import { expect } from 'chai'
import moment from 'moment'
import sinon from 'sinon'
import { getModel, wrapInTransaction, sequelize, truncateTables } from '@abx/db-connection-utils'
import * as symbols from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepthMidPrice, MarketDataTimeFrame, OHLCMarketData } from '@abx-types/market-data'
import * as realTimeMidPriceCalculator from '@abx-service-clients/market-data'
import { generateRealTimeOHLCMarketData, getOHLCMarketData, reconcileOHCLMarketData, CacheFirstMidPriceRepository } from '../..'

describe('ohlc_market_data_handler', () => {
  const symbolId = 'KAU_USD'

  beforeEach(async () => {
    await truncateTables()
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('generateRealTimeOHLCMarketData', () => {
    const getSymbolWithCurrencyPair = Promise.resolve({
      id: symbolId,
      base: {
        id: 2,
        code: CurrencyCode.kau,
        sortPriority: 1,
        orderPriority: 1,
      },
      quote: {
        id: 3,
        code: CurrencyCode.usd,
        sortPriority: 2,
        orderPriority: 2,
      },
      fee: {
        id: 2,
        code: CurrencyCode.kau,
        sortPriority: 1,
        orderPriority: 1,
      },
      orderRange: 0.3,
    })
    const mockMidPrice = 50

    beforeEach(() => {
      sinon.stub(symbols, 'getSymbolWithCurrencyPair').returns(getSymbolWithCurrencyPair)
      sinon.stub(realTimeMidPriceCalculator, 'calculateRealTimeMidPriceForSymbol').resolves(mockMidPrice)
    })

    it('should generate a OHLC data with real-time value for one minute time frame', async () => {
      await wrapInTransaction(sequelize, null, async transaction => {
        const marketData = [
          createOHLCMarketData(1, symbolId, MarketDataTimeFrame.oneMinute, new Date()),
          createOHLCMarketData(2, symbolId, MarketDataTimeFrame.oneMinute, new Date()),
        ]

        await getModel<OHLCMarketData>('ohlc_market_data').bulkCreate(marketData)

        const result = await generateRealTimeOHLCMarketData(symbolId, MarketDataTimeFrame.oneMinute, marketData[1], transaction)

        const mockRealTimeData: OHLCMarketData = {
          symbolId,
          createdAt: result.createdAt,
          open: marketData[1].close,
          close: mockMidPrice,
          high: mockMidPrice,
          low: marketData[1].close,
          timeFrame: MarketDataTimeFrame.oneMinute,
        }

        expect(result).to.eql(mockRealTimeData)
      })
    })

    it('should generate a OHLC data with real-time value for non one minute time frame', async () => {
      await wrapInTransaction(sequelize, null, async transaction => {
        const marketData = [
          createOHLCMarketData(1, symbolId, MarketDataTimeFrame.fifteenMinutes, new Date()),
          createOHLCMarketData(2, symbolId, MarketDataTimeFrame.fifteenMinutes, new Date()),
          createOHLCMarketData(3, symbolId, MarketDataTimeFrame.oneHour, new Date()),
        ]

        await getModel<OHLCMarketData>('ohlc_market_data').bulkCreate(marketData)

        const result = await generateRealTimeOHLCMarketData(symbolId, MarketDataTimeFrame.oneHour, marketData[2], transaction)

        const mockRealTimeData: OHLCMarketData = {
          symbolId,
          createdAt: result.createdAt,
          open: marketData[2].close,
          close: mockMidPrice,
          high: marketData[0].high,
          low: marketData[1].low,
          timeFrame: MarketDataTimeFrame.oneHour,
        }

        expect(result).to.eql(mockRealTimeData)
      })
    })
  })

  describe('getOHLCMarketData', () => {
    const getSymbolWithCurrencyPair = Promise.resolve({
      id: symbolId,
      base: {
        id: 2,
        code: CurrencyCode.kau,
        sortPriority: 1,
        orderPriority: 1,
      },
      quote: {
        id: 3,
        code: CurrencyCode.usd,
        sortPriority: 2,
        orderPriority: 2,
      },
      fee: {
        id: 2,
        code: CurrencyCode.kau,
        sortPriority: 1,
        orderPriority: 1,
      },
      orderRange: 0.3,
    })
    const mockMidPrice = 50

    beforeEach(() => {
      sinon.stub(symbols, 'getSymbolWithCurrencyPair').returns(getSymbolWithCurrencyPair)
      sinon.stub(realTimeMidPriceCalculator, 'calculateRealTimeMidPriceForSymbol').resolves(mockMidPrice)
    })

    it('should get all market data for symbol ID', async () => {
      await wrapInTransaction(sequelize, null, async transaction => {
        const marketData = [
          createOHLCMarketData(1, symbolId, MarketDataTimeFrame.oneHour, new Date()),
          createOHLCMarketData(2, symbolId, MarketDataTimeFrame.oneHour, new Date()),
        ]

        await getModel<OHLCMarketData>('ohlc_market_data').bulkCreate(marketData)

        const result = await getOHLCMarketData(
          symbolId,
          MarketDataTimeFrame.oneHour,
          moment()
            .subtract(1, 'hours')
            .toDate(),
          transaction,
        )

        const mockRealTimeData: OHLCMarketData = {
          symbolId,
          createdAt: result[2].createdAt,
          open: marketData[1].close,
          close: mockMidPrice,
          high: mockMidPrice,
          low: marketData[1].close,
          timeFrame: MarketDataTimeFrame.oneHour,
        }

        const expectedResult = [...marketData, mockRealTimeData]

        expect(result).to.eql(expectedResult)
      })
    })

    it('should only consider market data from the requested timeFrame', async () => {
      await wrapInTransaction(sequelize, null, async transaction => {
        const marketData = [
          createOHLCMarketData(1, symbolId, MarketDataTimeFrame.oneHour, new Date()),
          createOHLCMarketData(
            2,
            symbolId,
            MarketDataTimeFrame.fifteenMinutes,
            moment()
              .subtract(2, 'hours')
              .toDate(),
          ),
        ]
        await getModel<OHLCMarketData>('ohlc_market_data').bulkCreate(marketData)

        const result = await getOHLCMarketData(
          symbolId,
          MarketDataTimeFrame.oneHour,
          moment()
            .subtract(1, 'hours')
            .toDate(),
          transaction,
        )

        const mockRealTimeData: OHLCMarketData = {
          symbolId,
          createdAt: result[1].createdAt,
          open: marketData[0].close,
          close: mockMidPrice,
          high: mockMidPrice,
          low: marketData[0].close,
          timeFrame: MarketDataTimeFrame.oneHour,
        }

        const expectedResult = [marketData[0], mockRealTimeData]

        expect(result).to.eql(expectedResult)
      })
    })

    it('should only consider market data created after the fromDate', async () => {
      await wrapInTransaction(sequelize, null, async transaction => {
        const marketData = [
          createOHLCMarketData(
            1,
            symbolId,
            MarketDataTimeFrame.oneHour,
            moment()
              .subtract(2, 'hours')
              .toDate(),
          ),
          createOHLCMarketData(2, symbolId, MarketDataTimeFrame.oneHour, new Date()),
        ]
        await getModel<OHLCMarketData>('ohlc_market_data').bulkCreate(marketData)

        const result = await getOHLCMarketData(
          symbolId,
          MarketDataTimeFrame.oneHour,
          moment()
            .subtract(1, 'hours')
            .toDate(),
          transaction,
        )

        const mockRealTimeData: OHLCMarketData = {
          symbolId,
          createdAt: result[1].createdAt,
          open: marketData[0].close,
          close: mockMidPrice,
          high: mockMidPrice,
          low: marketData[0].close,
          timeFrame: MarketDataTimeFrame.oneHour,
        }

        const expectedResult = [marketData[1], mockRealTimeData]
        expect(result).to.eql(expectedResult)
      })
    })
  })

  describe('reconcileOHCLMarketData', () => {
    const openPrice = 10.1
    const highPrice = 130.2
    const closePrice = 100.2
    const lowPrice = 7.21

    const symbolIdToMidPrices = new Map<string, DepthMidPrice[]>()
    symbolIdToMidPrices.set(symbolId, [
      {
        id: 1,
        symbolId,
        price: openPrice,
        createdAt: moment()
          .subtract(10, 'minutes')
          .toDate(),
      },
      {
        id: 2,
        symbolId,
        price: highPrice,
        createdAt: moment()
          .subtract(8, 'minutes')
          .toDate(),
      },
      {
        id: 3,
        symbolId,
        price: 13.1,
        createdAt: moment()
          .subtract(7, 'minutes')
          .toDate(),
      },
      {
        id: 4,
        symbolId,
        price: 16.1,
        createdAt: moment()
          .subtract(6, 'minutes')
          .toDate(),
      },
      {
        id: 5,
        symbolId,
        price: lowPrice,
        createdAt: moment()
          .subtract(5, 'minutes')
          .toDate(),
      },
      {
        id: 6,
        symbolId,
        price: closePrice,
        createdAt: moment()
          .subtract(1, 'minutes')
          .toDate(),
      },
    ])

    const mockCacheFirstMidPriceRepository = {
      getOHLCOrderedMidPricesForSymbols: () => Promise.resolve(symbolIdToMidPrices),
    } as any

    beforeEach(() => {
      sinon.stub(CacheFirstMidPriceRepository, 'getInstance').returns(mockCacheFirstMidPriceRepository)
      sinon.stub(symbols, 'getAllCompleteSymbolDetails').returns(
        Promise.resolve([
          {
            id: symbolId,
            base: {
              id: 1,
              code: CurrencyCode.kau,
              sortPriority: 1,
              orderPriority: 1,
            },
            quote: {
              id: 2,
              code: CurrencyCode.usd,
              sortPriority: 2,
              orderPriority: 2,
            },
            fee: {
              id: 1,
              code: CurrencyCode.kau,
              sortPriority: 1,
              orderPriority: 1,
            },
            orderRange: 0.3,
          },
        ]),
      )
    })

    it('should use mid prices to deduce OHLC prices', async () => {
      await reconcileOHCLMarketData(MarketDataTimeFrame.fiveMinutes)

      const recordedOHLC = await getModel<OHLCMarketData>('ohlc_market_data').findOne({ where: { symbolId } })
      const instance = recordedOHLC!.get()

      expect(instance.symbolId).to.eql(symbolId)
      expect(instance.open).to.eql(openPrice)
      expect(instance.close).to.eql(closePrice)
      expect(instance.low).to.eql(lowPrice)
      expect(instance.high).to.eql(highPrice)
    })
  })
})

const createOHLCMarketData = (id, symbolId, timeFrame, recordDate) => ({
  id,
  symbolId,
  close: 12,
  open: 9,
  low: 7,
  high: 14,
  timeFrame,
  createdAt: recordDate,
  updatedAt: recordDate,
})
