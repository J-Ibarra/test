import axios from 'axios'
import { expect } from 'chai'
import sinon from 'sinon'

import { SupportedFxPair } from '@abx-types/order'
import { sourceFxRateFromXignite, authToken } from '../xignite_fx_rate_source'

describe('xignite_fx_rate_source', () => {
  let sandbox

  beforeEach(() => (sandbox = sinon.createSandbox()))

  afterEach(() => {
    sandbox.restore()
    sinon.restore()
  })

  it('should call https://globalcurrencies.xignite.com/xGlobalCurrencies.json/GetRealTimeRate when retrieving rates', async () => {
    const chfRate = 1.02

    const axiosStub = sandbox.stub(axios, 'get').callsFake(() => Promise.resolve({ data: { Ask: chfRate } }))

    const rate = await sourceFxRateFromXignite(SupportedFxPair.USD_CHF)
    expect(
      axiosStub.calledWith('https://globalcurrencies.xignite.com/xGlobalCurrencies.json/GetRealTimeRate', {
        params: {
          Symbol: 'USDCHF',
          _token: authToken,
        },
        timeout: 10_000,
      }),
    ).to.eql(true)
    expect(rate.success).to.eql(true)
    expect(rate.price).to.eql(chfRate)
  })

  it('should return error response if call to https://globalcurrencies.xignite.com/xGlobalCurrencies.json/GetRealTimeRate fails', async () => {
    const errorMessage = 'Foo bar'
    const axiosStub = sandbox.stub(axios, 'get').throws(() => new Error(errorMessage))

    const rate = await sourceFxRateFromXignite(SupportedFxPair.USD_CHF)
    expect(
      axiosStub.calledWith('https://globalcurrencies.xignite.com/xGlobalCurrencies.json/GetRealTimeRate', {
        params: {
          Symbol: 'USDCHF',
          _token: authToken,
        },
        timeout: 10_000,
      }),
    ).to.eql(true)
    expect(rate.success).to.eql(false)
    expect(rate.error).to.eql(errorMessage)
  })
})
