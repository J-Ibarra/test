import { expect } from 'chai'

import { CurrencyBoundary } from '@abx-types/reference-data'
import { truncateCurrencyDecimals } from '../utils'

describe('deposit helpers', () => {
  describe('truncateCurrencyDecimals', () => {
    const fourDecimals = 4
    const maxFourDecimals = { maxDecimals: fourDecimals } as CurrencyBoundary

    const oneDecimal = 1
    const maxoneDecimal = { maxDecimals: oneDecimal } as CurrencyBoundary

    it('Truncates a number to maxDecimals of given boundary', async () => {
      expect(truncateCurrencyDecimals(maxFourDecimals, 1.1234999)).to.equal(1.1234)
      expect(truncateCurrencyDecimals(maxFourDecimals, 1.000001)).to.equal(1)

      expect(truncateCurrencyDecimals(maxoneDecimal, 1.000001)).to.equal(1)
      expect(truncateCurrencyDecimals(maxoneDecimal, 1.19)).to.equal(1.1)
    })

    it('Truncates a number to maxDecimals of given boundary (curried)', async () => {
      const truncateTo4DP = truncateCurrencyDecimals(maxFourDecimals) as any
      const truncateTo1DP = truncateCurrencyDecimals(maxoneDecimal) as any

      expect(truncateTo4DP(1.1234999)).to.equal(1.1234)
      expect(truncateTo4DP(1.000001)).to.equal(1)

      expect(truncateTo1DP(1.000001)).to.equal(1)
      expect(truncateTo1DP(1.19)).to.equal(1.1)
    })
  })
})
