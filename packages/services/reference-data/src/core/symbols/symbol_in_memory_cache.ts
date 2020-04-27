import { Transaction, WhereOptions } from 'sequelize'
import { getModel, MemoryCache } from '@abx-utils/db-connection-utils'
import { Currency, SymbolPair, SymbolPairStateFilter, localAndTestEnvironments, Environment } from '@abx-types/reference-data'
import { GetAllSymbolsRequestPayload } from './find_symbols'

const symbolsCache = MemoryCache.getInstance()
const SYMBOL_KEY = 'SYMBOL_KEY'

export async function fetchAllSymbols(
  { state, transaction }: GetAllSymbolsRequestPayload = { state: SymbolPairStateFilter.enabled },
): Promise<SymbolPair[]> {
  let stateToFilter = state || SymbolPairStateFilter.enabled

  let cachedSymbols = symbolsCache.get<SymbolPair[]>(SYMBOL_KEY)

  if (cachedSymbols) {
    return filterSymbols(cachedSymbols, stateToFilter)
  }

  cachedSymbols = await findSymbols(transaction)

  if (!localAndTestEnvironments.includes(process.env.NODE_ENV as Environment)) {
    symbolsCache.set<SymbolPair[]>({
      key: SYMBOL_KEY,
      ttl: 30_000,
      val: cachedSymbols,
    })
  }

  return filterSymbols(cachedSymbols, stateToFilter)
}

function filterSymbols(symbols: SymbolPair[], state: SymbolPairStateFilter) {
  return state === SymbolPairStateFilter.all
    ? symbols
    : symbols.filter(({ isEnabled }) => (state === SymbolPairStateFilter.disabled ? isEnabled === false : isEnabled === true))
}

export async function findSymbols(transaction?: Transaction): Promise<SymbolPair[]> {
  const allSymbols = await getModel<SymbolPair>('symbol').findAll({
    transaction,
    include: [createCurrencyIncludeOption('quote'), createCurrencyIncludeOption('base'), createCurrencyIncludeOption('fee')],
  })

  return allSymbols.map((symbol) => symbol.get() as any)
}

export async function updateOrderRangeForSymbol(symbolId: string, amount: number) {
  const orderRangeAmount = amount === -1 ? null : amount

  await getModel<Partial<SymbolPair>>('symbol').update({ orderRange: orderRangeAmount }, { where: { id: symbolId } })

  const cachedSymbols = symbolsCache.get<SymbolPair[]>(SYMBOL_KEY)

  if (cachedSymbols) {
    symbolsCache.set<SymbolPair[]>({
      key: SYMBOL_KEY,
      ttl: 30_000,
      val: cachedSymbols.map((symbol) => (symbol.id === symbolId ? { ...symbol, orderRange: orderRangeAmount } : symbol)),
    })
  }
}

const createCurrencyIncludeOption = (as: string, where: WhereOptions = {}) => ({
  model: getModel<Currency>('currency'),
  as,
  attributes: ['id', 'code'],
  where,
})
