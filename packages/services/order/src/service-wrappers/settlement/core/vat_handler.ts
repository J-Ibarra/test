import Decimal from 'decimal.js'
import { taxScale, CurrencyCode, SymbolPair } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { UsdMidPriceEnrichedOrderMatch, SupportedFxPair, Tax } from '@abx-types/order'
import { getQuoteFor } from '@abx-utils/fx-rate'
import { feeTakenFromBase } from '@abx-service-clients/reference-data'

const logger = Logger.getInstance('lib', 'vat_handler')

interface GetVatFeeParam {
  buyerExecutionFee: number
  sellerExecutionFee: number
  orderMatch: UsdMidPriceEnrichedOrderMatch
  symbol: SymbolPair
  vatRate: number
}

type VatValue = Pick<Tax, 'valueInCHF' | 'valueInFeeCurrency'>

/**
 * The steps performed when calculating the VAT fee are as follows:
 * 1. The USD value of VAT fee is calculated using the following logic:
 * 1.1 The USD execution fee value is calculated:
 * 1.1.a) if pair.quote === USD && feeTakenFromBase  - executionFeeInUSD = executionFee * orderMatchPrice
 * 1.1.b) if pair.quote === USD && feeTakenFromQuote - executionFeeInUSD = executionFee (the execution fee is already in USD so no need to convert)
 * 1.1.c) if pair.quote !== USD - We need to get the USD value for 1 fee currency which we use {@link calculateRealTimeMidPriceForSymbol} for
 * retrieving the latest `{FeeCurrency}_USD` mid price. The execution fee USD value is then simply executionFee * latestFeeCurrencyUsdPrice
 * The one exception to this is when `FeeCurrency` is `EUR` or `GBP` where we use our FX providers to get `EUR_USD` (or `GBP_USD` respectively) rate
 * 1.2 Having computed the execution fee USD value, we can then compute the USD VAT rate
 *
 * 2. We need to get the `CFH/USD` rate to be able to convert the USD VAT amount into CFH which is simply USD value / USDs for 1 CFH
 * the execution fee in CFH.
 * @param vatFeeParams The details required to compute the vat fee for an order match
 */
export async function getVatFees({
  buyerExecutionFee,
  sellerExecutionFee,
  symbol,
  vatRate,
  orderMatch: { feeCurrencyToUsdMidPrice },
}: GetVatFeeParam): Promise<{ buyerVatAmount: VatValue; sellerVatAmount: VatValue }> {
  const chfForOneUsd = await getQuoteFor(SupportedFxPair.USD_CHF)

  const [sellerVatValue, buyerVatValue] = await Promise.all([
    calculateVatValue(sellerExecutionFee, symbol, vatRate, feeCurrencyToUsdMidPrice, chfForOneUsd),
    calculateVatValue(buyerExecutionFee, symbol, vatRate, feeCurrencyToUsdMidPrice, chfForOneUsd),
  ])

  return {
    buyerVatAmount: buyerVatValue,
    sellerVatAmount: sellerVatValue,
  }
}

function calculateVat(tradeExecutionFee: number, vatRate: number): Decimal {
  return new Decimal(vatRate).times(tradeExecutionFee).dividedBy(new Decimal(1).plus(vatRate))
}

export async function calculateVatValue(
  executionFee: number,
  symbol: SymbolPair,
  vatRate: number,
  feeCurrencyToUsdMidPrice: number,
  chfForOneUsd: Decimal,
): Promise<VatValue> {
  const vatFeeCurrencyValue = calculateVat(executionFee, vatRate)
  const vatUsdValue = await calculateVatUsdValue(executionFee, symbol, feeCurrencyToUsdMidPrice, vatRate)
  const vatChfValue = vatUsdValue.times(chfForOneUsd)

  return {
    valueInFeeCurrency: new Decimal(vatFeeCurrencyValue.toDP(taxScale, Decimal.ROUND_DOWN)),
    valueInCHF: new Decimal(vatChfValue.toDP(taxScale, Decimal.ROUND_DOWN)),
  }
}

export async function calculateVatUsdValue(
  executionFee: number,
  symbol: SymbolPair,
  feeCurrencyToUsdMidPrice: number,
  vatRate: number,
): Promise<Decimal> {
  const executionFeeInUSD = await getExecutionFeeInUsd(executionFee, symbol, feeCurrencyToUsdMidPrice)
  return calculateVat(executionFeeInUSD.toNumber(), vatRate)
}

export async function getExecutionFeeInUsd(executionFee: number, symbol: SymbolPair, feeCurrencyToUsdMidPrice: number): Promise<Decimal> {
  if (symbol.quote.code === CurrencyCode.usd) {
    return calculateExecutionFeeUsdValueForUsdQuotePair(symbol, executionFee, feeCurrencyToUsdMidPrice)
  } else {
    return calculateLatestFeeCurrencyUsdPrice(executionFee, symbol, feeCurrencyToUsdMidPrice)
  }
}

function calculateExecutionFeeUsdValueForUsdQuotePair(symbol: SymbolPair, executionFee: number, feeCurrencyToUsdMidPrice: number): Decimal {
  if (feeTakenFromBase(symbol)) {
    return new Decimal(feeCurrencyToUsdMidPrice).times(executionFee)
  }

  return new Decimal(executionFee)
}

async function calculateLatestFeeCurrencyUsdPrice(executionFee: number, symbol: SymbolPair, feeCurrencyToUsdMidPrice: number) {
  let latestFeeCurrencyUsdPrice
  if (symbol.fee.code === CurrencyCode.euro) {
    latestFeeCurrencyUsdPrice = await getQuoteFor(SupportedFxPair.EUR_USD)
  } else if (symbol.fee.code === CurrencyCode.gbp) {
    latestFeeCurrencyUsdPrice = await getQuoteFor(SupportedFxPair.GBP_USD)
  } else {
    latestFeeCurrencyUsdPrice = feeCurrencyToUsdMidPrice
  }

  logger.debug(`Retrieved USD value for 1 ${symbol.fee.code}: ${latestFeeCurrencyUsdPrice}`)
  logger.debug(`Execution Fee: ${executionFee}`)
  return new Decimal(executionFee).times(latestFeeCurrencyUsdPrice)
}
