import { compact, head, last, max, maxBy, min, minBy, orderBy } from 'lodash'
import moment from 'moment'
import { Transaction } from 'sequelize'
import { Logger } from '@abx-utils/logging'
import { sequelize, getModel, DBOrder, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { getAllCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { DepthMidPrice, MarketDataTimeFrame, MidPricesForSymbolsRequest, OHLCMarketData } from '@abx-types/market-data'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { CacheFirstMidPriceRepository } from './repository/mid-price/cache_first_mid_price_repository'
import { SymbolPairStateFilter } from '@abx-types/reference-data'

/**
 * Computes the open, high, close and low depth prices for all symbols within an given time frame.
 * {@link DepthMidPrice} is used for the calculation where for each symbol:
 * - open - first mid price in the time frame
 * - close - last mid price in the time frame
 * - high - the highest mid price in time frame
 * - low - the lowest mid price in the time frame
 *
 * @param timeFrame
 */
export async function reconcileOHCLMarketData(timeFrame: MarketDataTimeFrame): Promise<any> {
  const symbols = await getAllCompleteSymbolDetails(SymbolPairStateFilter.all)

  const symbolIdToDepthMidPrices = await CacheFirstMidPriceRepository.getInstance().getOHLCOrderedMidPricesForSymbols(
    new MidPricesForSymbolsRequest(
      symbols.map(({ id }) => id),
      moment().subtract(timeFrame, 'minutes').toDate(),
    ),
  )

  const reconciliationTime = new Date()
  const allOHLCDataToReconcile = compact(
    await Promise.all(
      symbols.map(({ id }) =>
        computeOHCLForSymbol({
          symbolId: id,
          timeFrame,
          recordTime: reconciliationTime,
          midPricesForSymbol: symbolIdToDepthMidPrices.get(id)!,
        }),
      ),
    ),
  )

  await getModel<OHLCMarketData>('ohlc_market_data').bulkCreate(allOHLCDataToReconcile)
}

interface ComputeOHLCForSymbolParams {
  symbolId: string
  timeFrame: MarketDataTimeFrame
  recordTime: Date
  midPricesForSymbol: DepthMidPrice[]
}
/**
 * midPricesForSymbol should be ordered in oldest to newest (oldest being index 1)
 */
async function computeOHCLForSymbol({
  symbolId,
  timeFrame,
  recordTime,
  midPricesForSymbol = [],
}: ComputeOHLCForSymbolParams): Promise<OHLCMarketData | null> {
  const logger = Logger.getInstance('ohlc_market_data_handler', 'computeOHCLForSymbol')

  if (midPricesForSymbol.length === 0) {
    return null
  }
  const ohlcMarketData = await getModel<OHLCMarketData>('ohlc_market_data').findAll({
    where: {
      symbolId,
      timeFrame,
    },
    limit: 1,
    order: [['createdAt', DBOrder.DESC]],
  })
  const ohlcMarketDataSet = ohlcMarketData.map((marketData) => marketData.get())
  const lastOHLCMarketData = last(ohlcMarketDataSet)

  logger.debug(`Mid-price updates for ${symbolId} found`)

  const orderedByPrices = orderBy(midPricesForSymbol, 'price')
  const open = !!lastOHLCMarketData ? lastOHLCMarketData.close : head(midPricesForSymbol)!.price

  return {
    symbolId,
    open,
    close: (last(midPricesForSymbol) || { price: 0 }).price,
    high: max([(last(orderedByPrices) || { price: 0 }).price, open]) || 0,
    low: min([(head(orderedByPrices) || { price: 0 }).price, open]) || 0,
    timeFrame,
    createdAt: recordTime,
  }
}

/**
 * Gets OHLC data sequence for a symbol (deduced from the base and to currencies) for a given time frame.
 *
 * @param symbolId the symbol id
 * @param timeFrame the time frame
 * @param fromDate the start of the sequence
 * @param t the transaction to use, if present
 * @returns the OHLC market data
 */
export function getOHLCMarketData(symbolId: string, timeFrame: MarketDataTimeFrame, fromDate: Date, t?: Transaction): Promise<OHLCMarketData[]> {
  return wrapInTransaction(sequelize, t, async (transaction) => {
    const ohlcMarketData = await getModel<OHLCMarketData>('ohlc_market_data').findAll({
      where: {
        symbolId,
        timeFrame,
        createdAt: { $gte: fromDate },
      },
      transaction,
    })

    const ohlcMarketDataSet = ohlcMarketData.map((marketData) => marketData.get())
    const lastOHLCMarketData = last(ohlcMarketDataSet)
    const realtimeOHLCMarketData = await generateRealTimeOHLCMarketData(symbolId, timeFrame, lastOHLCMarketData, transaction)

    ohlcMarketDataSet.push(realtimeOHLCMarketData)
    return ohlcMarketDataSet
  })
}

/**
 * Generate the real-time OHLC market data
 * @param symbolId
 * @param timeFrame
 * @param lastOHLCMarketData
 * @param transaction
 */
export async function generateRealTimeOHLCMarketData(
  symbolId: string,
  timeFrame: MarketDataTimeFrame,
  lastOHLCMarketData: OHLCMarketData | undefined,
  transaction: Transaction,
): Promise<OHLCMarketData> {
  const createdAt = moment().toDate()
  const currentMidPrice = await calculateRealTimeMidPriceForSymbol(symbolId)

  if (timeFrame === MarketDataTimeFrame.oneMinute) {
    return generateOneMinuteRealTimeOHLCMarketData(symbolId, timeFrame, lastOHLCMarketData, currentMidPrice)
  }

  return generateNonOneMinuteRealTimeOHLCMarketData(symbolId, timeFrame, lastOHLCMarketData, currentMidPrice, createdAt, transaction)
}

/**
 * Generate the real-time OHLC market data if the time frame is one minute
 * This will make:
 * open: last minute's data' close
 * close: the current mid price
 * high: highest value between open and close
 * low: lowest value between open and close
 *
 * @param symbolId
 * @param timeFrame
 * @param lastOHLCMarketData
 * @param currentMidPrice
 * @param createdAt
 */
export function generateOneMinuteRealTimeOHLCMarketData(
  symbolId: string,
  timeFrame: MarketDataTimeFrame,
  lastOHLCMarketData: OHLCMarketData | undefined,
  currentMidPrice: number,
): OHLCMarketData {
  const open = !!lastOHLCMarketData ? lastOHLCMarketData.close : currentMidPrice
  const createdAt = !!lastOHLCMarketData ? moment(lastOHLCMarketData.createdAt).add(1, 'minute').toDate() : moment().toDate()

  return {
    symbolId,
    timeFrame,
    open,
    close: currentMidPrice,
    high: max([open, currentMidPrice]) || 0,
    low: min([open, currentMidPrice]) || 0,
    createdAt,
  }
}

/**
 * Generate the real-time OHLC market data if the time frame is not one minute
 * This will look back the certain time frame data in the provide time frame period, such as:
 *
 * Generating 15 minutes time frame data will look for 1 min interval data in last 15 minutes, then:
 * open: last 15 minute's data's close
 * close: current mid price
 * high: highest value in 1 minute interval val data in last 15 minutes
 * low: lowest value in 1 minute interval val data in last 15 minutes
 *
 * @param symbolId
 * @param timeFrame
 * @param lastOHLCMarketData
 * @param currentMidPrice
 * @param createdAt
 * @param transaction
 */
async function generateNonOneMinuteRealTimeOHLCMarketData(
  symbolId: string,
  timeFrame: MarketDataTimeFrame,
  lastOHLCMarketData: OHLCMarketData | undefined,
  currentMidPrice: number,
  createdAt: Date,
  transaction: Transaction,
) {
  const fromDate = moment(createdAt).subtract(timeFrame, 'minutes').toDate()
  const interval = getCalculateIntervalForTimeFrame(timeFrame)
  const ohlcMarketData = await getModel<OHLCMarketData>('ohlc_market_data').findAll({
    where: {
      symbolId,
      timeFrame: interval,
      createdAt: { $gte: fromDate },
    },
    transaction,
  })

  const newCreatedAt = !!lastOHLCMarketData ? moment(lastOHLCMarketData.createdAt).add(timeFrame, 'minutes').toDate() : moment().toDate()

  const ohlcDataSet = ohlcMarketData.map((marketData) => marketData.get())
  const open = !!lastOHLCMarketData ? lastOHLCMarketData.close : currentMidPrice
  const close = currentMidPrice

  const dataWithHighestValue = maxBy(ohlcDataSet, (data) => data.high)
  const high = !!dataWithHighestValue ? dataWithHighestValue.high : max([open, close])

  const dataWithLowestValue = minBy(ohlcDataSet, (data) => data.low)
  const low = !!dataWithLowestValue ? dataWithLowestValue.low : min([open, close])
  return {
    symbolId,
    open,
    high: high || 0,
    low: low || 0,
    close,
    timeFrame,
    createdAt: newCreatedAt,
  }
}

function getCalculateIntervalForTimeFrame(timeFrame: MarketDataTimeFrame) {
  switch (timeFrame) {
    case MarketDataTimeFrame.oneMinute:
    case MarketDataTimeFrame.fiveMinutes:
    case MarketDataTimeFrame.fifteenMinutes:
      return MarketDataTimeFrame.oneMinute
    case MarketDataTimeFrame.thirtyMinutes:
      return MarketDataTimeFrame.fiveMinutes
    case MarketDataTimeFrame.oneHour:
      return MarketDataTimeFrame.fifteenMinutes
    case MarketDataTimeFrame.fourHours:
      return MarketDataTimeFrame.thirtyMinutes
    case MarketDataTimeFrame.sixHours:
      return MarketDataTimeFrame.oneHour
    case MarketDataTimeFrame.twelveHours:
      return MarketDataTimeFrame.fourHours
    case MarketDataTimeFrame.twentyFourHours:
      return MarketDataTimeFrame.sixHours
    default:
      return MarketDataTimeFrame.oneMinute
  }
}
