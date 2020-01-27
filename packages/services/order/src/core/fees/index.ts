import Decimal from 'decimal.js'
import { last, orderBy } from 'lodash'
import { recordCustomEvent } from 'newrelic'
import { Transaction } from 'sequelize'
import { findBoundaryForCurrency } from '@abx-service-clients/reference-data'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { AccountFeeTiersRequest, FeeTier } from '@abx-types/order'
import { getAccountFeeTiersForSymbol } from './tiers/account_fee_tiers'
import { getDefaultFeeTiersForSymbol } from './tiers/default_fee_tiers'
import { TradeAccumulationRepository } from './trade_accumulation/trade_accumulation_repository'
const logger = Logger.getInstance('packages', 'fees')

const tradeAccumulationRepository = TradeAccumulationRepository.getInstance()

/**
 * Retrieves the fee rate for an account and symbol based on the monthly trading volumes for the account
 * and the fee tiers specific to the account. In case no account level fee tiers are defined the default fee
 * tiers for the symbol are used.
 *
 * @param accountId the account id
 * @param symbolId the symbol id
 * @param transaction the parent transaction to use, if present
 * @returns the fee rate
 */
export async function getFeeRateForAccount({ accountId, symbolId }: AccountFeeTiersRequest, transaction?: Transaction): Promise<number | undefined> {
  const feeTiers: FeeTier[] = await getFeeTiers(accountId, symbolId, transaction)
  const accountMonthlyTradeAccumulation = await tradeAccumulationRepository.getMonthlyTradeAccumulationForAccount(accountId, new Date(), transaction)

  const tier = determineApplicableTier(feeTiers, accountMonthlyTradeAccumulation)
  return !!tier ? tier.rate : undefined
}

/**
 * Retrieves the maximum fee rate for an account and symbol using the fee tiers specific to the account.
 * In case no account level fee tiers are defined the default fee tiers for the symbol are used.
 *
 * @param accountId the account id
 * @param symbolId the symbol id
 * @param transaction the parent transaction to use, if present
 * @returns the fee rate
 */
export async function getMaxFeeRate(accountId: string, symbolId: string, transaction?: Transaction): Promise<number> {
  const feeTiers = await getFeeTiers(accountId, symbolId, transaction)

  const highestRateFirstTiers = orderBy(feeTiers, ['rate'], ['desc'])

  return highestRateFirstTiers[0].rate
}

/**
 * Picks the appropriate fee tier based on the monthly accumulated trades for an account
 * where the tierThreshold >= accumulatedTrades, If monthly trade volume > highest threshold,
 * the highest threshold tier is returned.
 *
 * @param tiers
 * @param accountTradeAccumulation
 */
function determineApplicableTier(tiers: FeeTier[], accountTradeAccumulation: number): FeeTier | undefined {
  return tiers.find(({ threshold }) => accountTradeAccumulation < threshold) || last(tiers)
}

/**
 * Fetches the account level fee tiers for an account and symbol.
 * If no account level fees have been defined the default feels for the symbol are used.
 *
 * @param accountId
 * @param symbolId
 * @param transaction
 */
async function getFeeTiers(accountId: string, symbolId: string, transaction?: Transaction): Promise<FeeTier[]> {
  let feeTiers: FeeTier[] = await getAccountFeeTiersForSymbol(accountId, symbolId, transaction)

  if (feeTiers.length === 0) {
    feeTiers = await getDefaultFeeTiersForSymbol(symbolId, transaction)
  }

  return feeTiers
}

/**
 * Calculates the maximum amount that a trade can potentially cost,
 * using the highest rate fee tier for the give currency pair.
 * The function is to determine the amount to reserve
 * - before order execution(matching) for limit buy orders when the fee is taken from the quote
 * - at order execution for market orders after the total trade value has been calculated
 * - at order settlement when rebating reserve balance when the fee is taken from the quote
 *
 * @param price the trade limit price
 * @param amount the trade amount
 * @param accountId the trading account id
 * @param symbolId the currency pair symbol id
 * @param maxDecimalsForCurrency the maximum decimal digits the currency value is allowed to have
 * @param transaction the transaction to use
 */
export async function determineMaxBuyReserve({
  orderId,
  price,
  amount,
  accountId,
  symbolId,
  feeCurrencyCode,
  maxDecimalsForCurrency,
  transaction,
}: {
  orderId: number
  price: number
  amount: number
  accountId: string
  symbolId: string
  feeCurrencyCode: CurrencyCode
  maxDecimalsForCurrency: number
  transaction?: Transaction
}): Promise<number> {
  if (!price) {
    return 0
  }

  const orderValue = new Decimal(amount).times(price)

  const maxFeeRate = await getMaxFeeRate(accountId, symbolId, transaction)
  const orderFee = orderValue.times(maxFeeRate)

  const feeToUse = orderFee.equals(0) ? 0 : (await determineMaxFee({ orderFee, feeCurrencyCode })).toNumber()
  recordCustomEvent('event_determine_max_buy_reserve', {
    orderId,
    symbolId,
    amount,
    matchPrice: price,
    calculatedFee: feeToUse,
  })
  logger.debug(
    `determine max buy reserve: ${JSON.stringify({
      orderId,
      symbolId,
      amount,
      matchPrice: price,
      calculatedFee: feeToUse,
    })}`,
  )

  return new Decimal(orderValue)
    .plus(feeToUse)
    .toDP(maxDecimalsForCurrency, Decimal.ROUND_DOWN)
    .toNumber()
}

/**
 * Calculates the maximum amount that a trade can potentially cost,
 * using the highest rate fee tier for the give currency pair.
 * The function is to determine the amount to reserve
 * - before order execution(matching) for limit sell orders when the fee is taken from the base
 * - at order settlement when rebating reserve balance when the fee is taken from the base
 *
 * @param price the trade limit price
 * @param amount the trade amount
 * @param accountId the trading account id
 * @param symbolId the currency pair symbol id
 * @param maxDecimals the maximum decimal digits allowed
 * @param transaction the transaction to use
 */
export async function determineMaxReserveForTradeValue({
  amount,
  accountId,
  symbolId,
  maxDecimalsForCurrency,
  feeCurrencyCode,
  t,
}: {
  amount: number
  accountId: string
  symbolId: string
  maxDecimalsForCurrency: number
  feeCurrencyCode: CurrencyCode
  t?: Transaction
}): Promise<number> {
  const maxFeeRate = await getMaxFeeRate(accountId, symbolId, t)
  const orderFee = new Decimal(amount).times(maxFeeRate)
  const feeToUse = await determineMaxFee({ orderFee, feeCurrencyCode })

  return new Decimal(amount)
    .plus(feeToUse)
    .toDP(maxDecimalsForCurrency, Decimal.ROUND_DOWN)
    .toNumber()
}

export const determineMaxFee = async ({ orderFee, feeCurrencyCode }: { orderFee: Decimal; feeCurrencyCode: CurrencyCode }): Promise<Decimal> => {
  if (orderFee.equals(0)) {
    return orderFee
  }
  const fetchedBoundaryRow = await findBoundaryForCurrency(feeCurrencyCode)
  return Decimal.max(fetchedBoundaryRow.minAmount || 0, orderFee)
}

export * from './tiers'
export * from './trade_accumulation'
