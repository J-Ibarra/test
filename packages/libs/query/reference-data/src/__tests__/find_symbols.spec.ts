
import { expect } from 'chai'

import { CurrencyCode } from '@abx-types/reference-data'
import { getAllCompleteSymbolDetails, getAllSymbolsIncludingCurrency, getSymbolsForQuoteCurrency, getSymbolWithCurrencyPair } from '../lib/symbols/find_symbols'

describe('find_symbols', () => {
  it('getSymbolsForQuoteCurrency should find all symbols for a quote currency', async () => {
    const symbols = await getSymbolsForQuoteCurrency(CurrencyCode.ethereum)

    expect(symbols.length).to.eql(1)
  })

  it('getSymbolWithCurrencyPair should get the symbol for a currency pair', async () => {
    const symbol = await getSymbolWithCurrencyPair(CurrencyCode.ethereum, CurrencyCode.kau)

    expect(symbol).to.not.eql(undefined)
  })

  it('getAllSymbolSummaries should include the base and to currencies', async () => {
    const symbols = await getAllCompleteSymbolDetails()

    expect(symbols.length).to.eql(14)
  })

  it('getAllSymbolsIncludingCurrency should retrieve all symbols including a given currency', async () => {
    const symbols = await getAllSymbolsIncludingCurrency(CurrencyCode.kau)

    expect(symbols.length).to.eql(5)
  })
})
