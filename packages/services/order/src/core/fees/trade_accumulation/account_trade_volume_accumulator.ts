import moment from 'moment'

import { Logger } from '@abx/logging'
import { RuntimeError } from '@abx-types/error'
import { getCompleteSymbolDetails } from '@abx-service-clients/reference-data'
import { TradeAccumulationRequest } from '@abx-types/order'
import { TradeAccumulationStrategyFactory } from './accumulation_price_calculation_strategies'
import { TradeAccumulationRepository } from './trade_accumulation_repository'

/** The mechanism responsible for calculating and recording the monthly trade amount for users. */
export class AccountTradeVolumeAccumulator {
  private logger = Logger.getInstance('lib', 'AccountTradeVolumeAccumulator')

  private static instance: AccountTradeVolumeAccumulator

  /** Creates and returns a {@link TradeAccumulationRepository} instance, if one already created returns that. */
  public static getInstance(): AccountTradeVolumeAccumulator {
    if (!this.instance) {
      this.instance = new AccountTradeVolumeAccumulator()
    }

    return this.instance
  }

  constructor(
    private tradeAccumulationRepository = TradeAccumulationRepository.getInstance(),
    private tradeAccumulationStrategyFactory = new TradeAccumulationStrategyFactory(),
  ) {}

  /**
   * Calculates the USD value of the trade and adds that to the existing
   * trade volume for the order account for the given month and year.
   *
   * @param request contains the amount and price of the order
   */
  public async incrementMonthlyTradeAccumulationForAccount({
    accountId,
    symbolId,
    amount,
    price,
    transaction,
    date,
  }: TradeAccumulationRequest): Promise<void> {
    const symbol = await getCompleteSymbolDetails(symbolId)

    if (!symbol) {
      this.logger.error(`Tried to accumulate trades for non-existent symbol id ${symbolId}`)
      throw new RuntimeError(`No symbol found for id ${symbolId}`)
    }

    const usdTradeValue = await this.tradeAccumulationStrategyFactory
      .getTradeAccumulationStrategy(symbol)
      .calculateUsdTradePrice(symbol, amount, price)
    this.logger.debug(`Calculated USD value of ${usdTradeValue} for symbol ${symbolId} amount ${amount} and price ${price}`)

    return this.tradeAccumulationRepository.updateTradeAmount(accountId, usdTradeValue, moment(date).month(), moment(date).year(), transaction as any)
  }
}
