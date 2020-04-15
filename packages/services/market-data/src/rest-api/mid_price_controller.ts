import { Controller, Get, Query, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'

import moment from 'moment'
import { Logger } from '@abx-utils/logging'
import { MarketDataTimeFrame, MidPricesForSymbolRequest } from '@abx-types/market-data'
import { CacheFirstMidPriceRepository, convertRealTimeMidPriceForSymbolsToObject } from '../core'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'

@Tags('market-data')
@Route('mid-price')
export class MidPriceController extends Controller {
  private logger = Logger.getInstance('api', 'MidPriceController')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @SuccessResponse('200')
  @Response('400', 'Bad request')
  @Get()
  public async getMidPriceForSymbolPair(@Query() symbolPairId: string, @Query() timeFrame?: MarketDataTimeFrame) {
    if (!symbolPairId) {
      this.setStatus(400)
      return
    }

    try {
      this.logger.debug(`Retrieving mid price for symbol pair: ${symbolPairId}`)
      return await CacheFirstMidPriceRepository.getInstance().getMidPricesForSymbol(
        new MidPricesForSymbolRequest(
          symbolPairId,
          moment()
            .subtract(timeFrame || MarketDataTimeFrame.oneHour, 'minutes')
            .toDate(),
        ),
      )
    } catch (error) {
      this.setStatus(error.status || 400)
      this.logger.error(`Retrieving mid price for symbol pair: ${symbolPairId} errors: ${error.status || 400} - ${error.message}`)

      return {
        message: error.message as string,
      }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/real-time')
  public async getRealTimeMidPriceForWalletSymbols() {
    try {
      this.logger.debug('Retrieving latest mid-price for wallet symbols')
      return await convertRealTimeMidPriceForSymbolsToObject()
    } catch (error) {
      this.setStatus(error.status || 400)
      this.logger.error(`Retrieving mid price for symbols, errors: ${error.status || 400} - ${error.message}`)

      return {
        message: error.message as string,
      }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/real-time/{symbolId}')
  public async getRealTimeMidPriceForSymbol(symbolId: string) {
    try {
      this.logger.debug(`Retrieving latest mid-price for symbols ${symbolId}`)
      const realTimeMidPriceForSymbol = await calculateRealTimeMidPriceForSymbol(symbolId)

      return { price: realTimeMidPriceForSymbol }
    } catch (error) {
      this.setStatus(error.status || 400)
      this.logger.error(`Retrieving mid price for symbol ${symbolId}, errors: ${error.status || 400} - ${error.message}`)

      return {
        message: error.message as string,
      }
    }
  }
}
