import moment from 'moment'
import { Transaction, WhereOptions } from 'sequelize'
import { getModel } from '@abx-utils/db-connection-utils'
import { Currency, SymbolPair, SymbolPairStateFilter } from '@abx-types/reference-data'
import { GetAllSymbolsRequestPayload } from './find_symbols'

let lastCache: Date = new Date()
let symbols: SymbolPair[] = []

export async function fetchAllSymbols(
  { state, transaction }: GetAllSymbolsRequestPayload = { state: SymbolPairStateFilter.enabled },
): Promise<SymbolPair[]> {
  let stateToFilter = state || SymbolPairStateFilter.enabled

  if (symbols.length > 0 && moment().diff(lastCache, 'minute') < 5) {
    return filterSymbols(stateToFilter)
  }

  symbols = await findSymbols(transaction)
  lastCache = new Date()

  return filterSymbols(stateToFilter)
}

function filterSymbols(state: SymbolPairStateFilter) {
  return state === SymbolPairStateFilter.all
    ? symbols
    : symbols.filter(({ isEnabled }) => (state === SymbolPairStateFilter.disabled ? isEnabled === false : isEnabled === true))
}

async function findSymbols(transaction?: Transaction): Promise<SymbolPair[]> {
  const allSymbols = await getModel<SymbolPair>('symbol').findAll({
    transaction,
    include: [createCurrencyIncludeOption('quote'), createCurrencyIncludeOption('base'), createCurrencyIncludeOption('fee')],
  })

  return allSymbols.map(symbol => symbol.get() as any)
}

const createCurrencyIncludeOption = (as: string, where: WhereOptions = {}) => ({
  model: getModel<Currency>('currency'),
  as,
  attributes: ['id', 'code'],
  where,
})
