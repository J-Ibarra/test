import { expect} from 'chai'
import {CurrencyCode} from '@abx-types/reference-data'
import {getFiatCurrencySymbol} from '../lib/symbols/get_currency_symbol'

describe('get currency symbol:', () => {
  it ('should return $ when the input currency is usd', () => {
    const testCurrency = CurrencyCode.usd
    const expectResult = '$'
    const result = getFiatCurrencySymbol(testCurrency)

    expect(result).to.eql(expectResult)
  })

  it ('should return $ when the input currency is usd', () => {
    const testCurrency = CurrencyCode.euro
    const expectResult = '€'
    const result = getFiatCurrencySymbol(testCurrency)

    expect(result).to.eql(expectResult)
  })
})
