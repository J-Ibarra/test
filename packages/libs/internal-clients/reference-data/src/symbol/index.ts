import { getEpicurusInstance } from '@abx/db-connection-utils'
import { SymbolEndpoints } from './endpoints'
import { CurrencyCode, SymbolPair, SymbolPairSummary } from '@abx-types/reference-data'

export function getAllCompleteSymbolDetails(): Promise<SymbolPair[]> {
  return fetchSymbolsIfInMemoryCacheExpired()
}

export async function getAllSymbolPairSummaries(): Promise<SymbolPairSummary[]> {
  const completeSymbolDetails = await getAllCompleteSymbolDetails()

  return completeSymbolDetails.map(transformToSummary)
}

export async function getAllSymbolsIncludingCurrency(currencyCode: CurrencyCode): Promise<SymbolPair[]> {
  return (await fetchSymbolsIfInMemoryCacheExpired()).reduce(
    (symbols, symbol) => (symbol.base.code === currencyCode || symbol.quote.code === currencyCode ? symbols.concat(symbol) : symbols),
    [] as SymbolPair[],
  )
}

export async function getCompleteSymbolDetails(symbolId: string): Promise<SymbolPair> {
  return (await fetchSymbolsIfInMemoryCacheExpired()).find(({ id }) => id === symbolId)!
}

export async function getSymbolPairSummary(id: string): Promise<SymbolPairSummary> {
  const symbol = await getCompleteSymbolDetails(id)

  return transformToSummary(symbol)
}

export async function getSymbolsForQuoteCurrency(quoteCurrencyCode: CurrencyCode): Promise<SymbolPair[]> {
  return (await fetchSymbolsIfInMemoryCacheExpired()).reduce(
    (symbols, symbol) => (symbol.quote.code === quoteCurrencyCode ? symbols.concat(symbol) : symbols),
    [] as SymbolPair[],
  )
}

export async function getSymbolsForBaseCurrency(baseCurrencyCode: CurrencyCode): Promise<SymbolPair[]> {
  return (await fetchSymbolsIfInMemoryCacheExpired()).reduce(
    (symbols, symbol) => (symbol.base.code === baseCurrencyCode ? symbols.concat(symbol) : symbols),
    [] as SymbolPair[],
  )
}

export async function getSymbolWithCurrencyPair(baseCurrencyCode: CurrencyCode, quoteCurrencyCode: CurrencyCode): Promise<SymbolPair> {
  return (await fetchSymbolsIfInMemoryCacheExpired()).find(({ base, quote }) => base.code === baseCurrencyCode && quote.code === quoteCurrencyCode)!
}

export function transformToSummary({ id, base, quote, fee, orderRange, sortOrder }: SymbolPair): SymbolPairSummary {
  return {
    id,
    baseId: base.id,
    quoteId: quote.id,
    feeId: fee.id,
    orderRange,
    sortOrder,
  }
}

function fetchSymbolsIfInMemoryCacheExpired(): Promise<SymbolPair[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(SymbolEndpoints.getAllCompleteSymbolDetails, {})
}

export * from './endpoints'
