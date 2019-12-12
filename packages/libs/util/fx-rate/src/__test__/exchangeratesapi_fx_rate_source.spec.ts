import { SupportedFxPair } from '@abx-types/order'

import axios from 'axios'
import { expect } from 'chai'
import sinon from 'sinon'

import { sourceFxRateFromExchangeRatesApi } from '../exchangeratesapi_fx_rate_source'

describe('exchangeratesapi_fx_rate_source', () => {
  let sandbox

  beforeEach(() => (sandbox = sinon.createSandbox()))

  afterEach(() => {
    sandbox.restore()
    sinon.restore()
  })

  it('should call https://api.exchangeratesapi.io/latest when retrieving rates', async () => {
    const chfRate = 1.02

    const axiosStub = sandbox.stub(axios, 'get').callsFake(() => Promise.resolve({ data: { rates: { CHF: chfRate } } }))

    const rate = await sourceFxRateFromExchangeRatesApi(SupportedFxPair.USD_CHF)
    expect(
      axiosStub.calledWith('https://api.exchangeratesapi.io/latest', {
        params: {
          base: 'USD',
        },
        timeout: 10_000,
      }),
    ).to.eql(true)
    expect(rate.success).to.eql(true)
    expect(rate.price).to.eql(chfRate)
  })

  it('should return error response if call to https://api.exchangeratesapi.io/latest fails', async () => {
    const errorMessage = 'Foo bar'
    const axiosStub = sandbox.stub(axios, 'get').throws(() => new Error(errorMessage))

    const rate = await sourceFxRateFromExchangeRatesApi(SupportedFxPair.USD_CHF)
    expect(
      axiosStub.calledWith('https://api.exchangeratesapi.io/latest', {
        params: {
          base: 'USD',
        },
        timeout: 10_000,
      }),
    ).to.eql(true)
    expect(rate.success).to.eql(false)
    expect(rate.error).to.eql(errorMessage)
  })
})
