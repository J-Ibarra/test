import { expect } from 'chai'
import Decimal from 'decimal.js'
import sinon from 'sinon'

import { SupportedFxPair } from '@abx-types/order'
import * as fxRateCacheOperations from '../fx_rate_cache'
import { getQuoteFor } from '../fx_rate_provider'
import { successFxRateResponse, errorFxRateResponse } from '../fx_source_response'

describe('fx_rate_provider', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('should return price from first provider when successfully retrieved', async () => {
    const response = successFxRateResponse(12)

    const updateCacheStub = sinon.stub(fxRateCacheOperations, 'updateCachedRateForSymbol')
    const result = await getQuoteFor(SupportedFxPair.USD_CHF, [() => Promise.resolve(response)])

    expect(result).to.eql(new Decimal(response.price))
    expect(updateCacheStub.calledWith(SupportedFxPair.USD_CHF, response)).to.eql(true)
  })

  it('should return response from second provider when first one failed', async () => {
    const response = successFxRateResponse(13)

    const updateCacheStub = sinon.stub(fxRateCacheOperations, 'updateCachedRateForSymbol')
    const result = await getQuoteFor(SupportedFxPair.USD_CHF, [() => Promise.resolve(errorFxRateResponse('foo')), () => Promise.resolve(response)])

    expect(result).to.eql(new Decimal(response.price))
    expect(updateCacheStub.calledWith(SupportedFxPair.USD_CHF, response)).to.eql(true)
  })

  it('should return 0 when all providers failed', async () => {
    const updateCacheStub = sinon.stub(fxRateCacheOperations, 'updateCachedRateForSymbol')
    const result = await getQuoteFor(SupportedFxPair.USD_CHF, [
      () => Promise.resolve(errorFxRateResponse('foo')),
      () => Promise.resolve(errorFxRateResponse('bar')),
    ])

    expect(result).to.eql(new Decimal(0))
    expect(updateCacheStub.callCount).to.eql(0)
  })
})
