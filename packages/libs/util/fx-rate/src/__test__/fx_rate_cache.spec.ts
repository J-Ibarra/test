import { expect } from 'chai'
import sinon from 'sinon'

import { SupportedFxPair } from '@abx-types/order'
import { sourceFxRateFromCache, updateCachedRateForSymbol } from '../fx_rate_cache'
import { successFxRateResponse } from '../fx_source_response'

describe('fx_rate_cache', () => {
  afterEach(() => {
    sinon.restore()
  })

  describe('sourceFxRateFromCache', () => {
    it('should return cached price in success reponse when price present', async () => {
      const cachedPrice = 12

      const fxPairResponse = await sourceFxRateFromCache(SupportedFxPair.USD_CHF, {
        get: () => Promise.resolve(cachedPrice) as any,
      } as any)

      expect(fxPairResponse.success).to.eql(true)
      expect(fxPairResponse.price).to.eql(cachedPrice)
    })

    it('should return error response when no cached price present', async () => {
      const fxPairResponse = await sourceFxRateFromCache(SupportedFxPair.USD_CHF, {
        get: () => Promise.resolve() as any,
      } as any)

      expect(fxPairResponse.success).to.eql(false)
    }).timeout(60_000)
  })

  describe('updateCachedRateForSymbol', () => {
    it('should update price in cache when cacheRate flag set to true', async () => {
      const price = 12
      const setStub = sinon.spy()

      await updateCachedRateForSymbol(SupportedFxPair.USD_CHF, successFxRateResponse(price), {
        set: setStub,
      } as any)
      expect(setStub.calledWith('exchange:fx-rates:USD_CHF', price)).to.eql(true)
    })

    it('should not update price in cache when cacheRate flag set to false', async () => {
      const price = 12
      const setStub = sinon.stub().returns(Promise.resolve())

      await updateCachedRateForSymbol(SupportedFxPair.USD_CHF, successFxRateResponse(price, false), {
        set: setStub,
      } as any)
      expect(setStub.callCount).to.eql(0)
    })
  })
})
