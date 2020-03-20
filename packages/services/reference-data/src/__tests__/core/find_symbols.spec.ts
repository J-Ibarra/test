import { expect } from 'chai'
import sinon from 'sinon'

import { CurrencyCode } from '@abx-types/reference-data'
import { getAllCompleteSymbolDetails, getAllSymbolsIncludingCurrency, getSymbolsForQuoteCurrency, getSymbolWithCurrencyPair } from '../../core'
import * as currencies from '../../core/symbols/currency_in_memory_cache'
import * as symbols from '../../core/symbols/symbol_in_memory_cache'
const rewire = require("rewire")
const symbolsCache = rewire('../../core/symbols/symbol_in_memory_cache')

describe('find_symbols', () => {
  let findAllCurrenciesStub
  let fetchAllSymbolsStub
    beforeEach(async () => {
      findAllCurrenciesStub = sinon.stub(currencies, 'fetchAllCurrencies').callsFake(currencies.findCurrencies)
      fetchAllSymbolsStub = sinon.stub(symbols, 'fetchAllSymbols').callsFake(symbolsCache.fetchAllSymbols)
    })
    afterEach(async () => {
      findAllCurrenciesStub.restore()
      fetchAllSymbolsStub.restore()
    })

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
