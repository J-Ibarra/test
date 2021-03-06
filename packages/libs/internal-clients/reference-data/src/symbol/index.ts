import { SymbolEndpoints } from './endpoints'
import { CurrencyCode, SymbolPair, SymbolPairSummary, SymbolPairStateFilter } from '@abx-types/reference-data'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { REFERENCE_DATA_REST_API_PORT } from '../boundaries'

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(REFERENCE_DATA_REST_API_PORT)

export function getAllCompleteSymbolDetails(state: SymbolPairStateFilter = SymbolPairStateFilter.enabled): Promise<SymbolPair[]> {
  return fetchSymbolsIfInMemoryCacheExpired(state)
}

export async function getAllSymbolPairSummaries(state: SymbolPairStateFilter = SymbolPairStateFilter.enabled): Promise<SymbolPairSummary[]> {
  const completeSymbolDetails = await fetchSymbolsIfInMemoryCacheExpired(state)

  return completeSymbolDetails.map(transformToSummary)
}

export async function getAllSymbolsIncludingCurrency(currencyCode: CurrencyCode, state?: SymbolPairStateFilter): Promise<SymbolPair[]> {
  return (await fetchSymbolsIfInMemoryCacheExpired(state)).reduce(
    (symbols, symbol) => (symbol.base.code === currencyCode || symbol.quote.code === currencyCode ? symbols.concat(symbol) : symbols),
    [] as SymbolPair[],
  )
}

export async function getCompleteSymbolDetails(symbolId: string, state?: SymbolPairStateFilter): Promise<SymbolPair> {
  return (await fetchSymbolsIfInMemoryCacheExpired(state)).find(({ id }) => id === symbolId)!
}

export async function getSymbolPairSummary(id: string, state = SymbolPairStateFilter.enabled): Promise<SymbolPairSummary> {
  const symbol = await getCompleteSymbolDetails(id, state)

  return transformToSummary(symbol)
}

export async function getSymbolsForQuoteCurrency(quoteCurrencyCode: CurrencyCode, state?: SymbolPairStateFilter): Promise<SymbolPair[]> {
  return (await fetchSymbolsIfInMemoryCacheExpired(state)).reduce(
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

function fetchSymbolsIfInMemoryCacheExpired(state: SymbolPairStateFilter = SymbolPairStateFilter.enabled): Promise<SymbolPair[]> {
  return internalApiRequestDispatcher.returnCachedValueOrRetrieveFromSource({
    endpoint: SymbolEndpoints.getAllCompleteSymbolDetails,
    responseBody: { state }
  })
}

export function findSymbolsByAccountId(accountId: string) {
  return internalApiRequestDispatcher.fireRequestToInternalApi<SymbolPair[]>(SymbolEndpoints.findSymbolsByAccountId, { accountId })
}

export * from './endpoints'
