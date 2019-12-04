import { Transaction } from 'sequelize'
import { CurrencyCode, SymbolPair, SymbolPairSummary } from '@abx-types/reference-data'
import { fetchAllSymbols } from './symbol_in_memory_cache'

export async function getSymbolPairSummary(id: string, transaction?: Transaction): Promise<SymbolPairSummary> {
  const symbol = await getCompleteSymbolDetails(id, transaction)

  return transformToSummary(symbol)
}

export async function getAllSymbolPairSummaries(transaction?: Transaction): Promise<SymbolPairSummary[]> {
  const symbols = await getAllCompleteSymbolDetails(transaction)

  return symbols.map(transformToSummary)
}

export async function getSymbolsForQuoteCurrency(quoteCurrencyCode: CurrencyCode, transaction?: Transaction): Promise<SymbolPair[]> {
  return (await fetchAllSymbols(transaction)).reduce(
    (symbols, symbol) => (symbol.quote.code === quoteCurrencyCode ? symbols.concat(symbol) : symbols),
    [] as SymbolPair[],
  )
}

export async function getSymbolsForBaseCurrency(baseCurrencyCode: CurrencyCode, transaction?: Transaction): Promise<SymbolPair[]> {
  return (await fetchAllSymbols(transaction)).reduce(
    (symbols, symbol) => (symbol.base.code === baseCurrencyCode ? symbols.concat(symbol) : symbols),
    [] as SymbolPair[],
  )
}

export async function getCompleteSymbolDetails(symbolId: string, transaction?: Transaction): Promise<SymbolPair> {
  return (await fetchAllSymbols(transaction)).find(({ id }) => id === symbolId)!
}

export async function getAllSymbolsIncludingCurrency(currency: CurrencyCode, transaction?: Transaction): Promise<SymbolPair[]> {
  return (await fetchAllSymbols(transaction)).reduce(
    (symbols, symbol) => (symbol.base.code === currency || symbol.quote.code === currency ? symbols.concat(symbol) : symbols),
    [] as SymbolPair[],
  )
}

export async function getSymbolWithCurrencyPair(baseCurrencyCode: CurrencyCode, quoteCurrencyCode: CurrencyCode): Promise<SymbolPair> {
  return (await fetchAllSymbols()).find(({ base, quote }) => base.code === baseCurrencyCode && quote.code === quoteCurrencyCode)!
}

export function getAllCompleteSymbolDetails(transaction?: Transaction): Promise<SymbolPair[]> {
  return fetchAllSymbols(transaction)
}

const transformToSummary = ({ id, base, quote, fee }: SymbolPair): SymbolPairSummary => ({
  id,
  baseId: base.id,
  quoteId: quote.id,
  feeId: fee.id,
})
