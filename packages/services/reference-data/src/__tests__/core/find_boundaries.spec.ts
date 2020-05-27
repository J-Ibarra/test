import { expect } from 'chai'
import sinon from 'sinon'

import { CurrencyCode } from '@abx-types/reference-data'
import { findAllBoundaries, findBoundariesForAll, findBoundaryForCurrency } from '../../core'
import * as currencies from '../../core/symbols/currency_in_memory_cache'

describe('Currency Boundary', () => {
  describe('findBoundariesForAll', () => {
    let findAllCurrenciesStub
    beforeEach(async () => {
      findAllCurrenciesStub = sinon.stub(currencies, 'fetchAllCurrencies').callsFake(currencies.findCurrencies)
    })
    afterEach(async () => {
      findAllCurrenciesStub.restore()
    })

    it('returns boundary object keyed by for given currency codes', async () => {
      const boundaries = await findBoundariesForAll([CurrencyCode.ethereum, CurrencyCode.kau, CurrencyCode.usd, CurrencyCode.kvt])

      expect(Object.keys(boundaries).length).to.equal(4)

      const {
        [CurrencyCode.ethereum]: ethereumBoundary,
        [CurrencyCode.kau]: kauBoundary,
        [CurrencyCode.usd]: usdBoundary,
        [CurrencyCode.kvt]: kvtBoundary,
      } = boundaries

      expect(ethereumBoundary.minAmount).to.equal(0.000001)
      expect(ethereumBoundary.maxDecimals).to.equal(6)

      expect(kauBoundary.minAmount).to.equal(0.00001)
      expect(kauBoundary.maxDecimals).to.equal(5)

      expect(usdBoundary.minAmount).to.equal(0.01)
      expect(usdBoundary.maxDecimals).to.equal(2)

      expect(kvtBoundary.minAmount).to.equal(1)
      expect(kvtBoundary.maxDecimals).to.equal(0)
    })

    it('returns single boundary when given one currency code', async () => {
      const ethereumBoundary = await findBoundaryForCurrency(CurrencyCode.ethereum)

      expect(ethereumBoundary.minAmount).to.equal(0.000001)
      expect(ethereumBoundary.maxDecimals).to.equal(6)
    })
  })

  it('findAllBoundaries', async () => {
    const boundaries = await findAllBoundaries()
    const boundaryCurrencyCodes = Object.keys(boundaries)

    expect(boundaryCurrencyCodes.length).to.equal(9)
    expect(boundaryCurrencyCodes).to.deep.equal(['KVT', 'USD', 'EUR', 'KAU', 'KAG', 'ETH', 'BTC', 'USDT', 'GBP'])
  })
})
