import moment from 'moment'
import { Transaction, WhereOptions } from 'sequelize'
import { getModel } from '@abx/db-connection-utils'
import { Currency, SymbolPair } from '@abx-types/reference-data'

let lastCache: Date = new Date()
let symbols: SymbolPair[] = []

export async function fetchAllSymbols(transaction?: Transaction): Promise<SymbolPair[]> {
  if (symbols.length > 0 && moment().diff(lastCache, 'minute') < 5) {
    return symbols
  }

  symbols = await findSymbols(transaction)
  lastCache = new Date()

  return symbols
}

async function findSymbols(transaction): Promise<SymbolPair[]> {
  const allSymbols = await getModel<SymbolPair>('symbol').findAll({
    where: {
      isEnabled: true,
    },
    transaction,
    include: [
      createCurrencyIncludeOption('quote'),
      createCurrencyIncludeOption('base'),
      createCurrencyIncludeOption('fee'),
    ],
  })

  return allSymbols.map(symbol => symbol.get() as any)
}

const createCurrencyIncludeOption = (as: string, where: WhereOptions = {}) => ({
  model: getModel<Currency>('currency'),
  as,
  attributes: ['id', 'code'],
  where,
})
