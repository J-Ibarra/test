import { expect } from 'chai'
import chai from 'chai'
import chaiThings from 'chai-things';
chai.use(chaiThings)

import sinon from 'sinon'
import request from 'supertest'
import { bootstrapRestApi } from '../../rest-api'
import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'
import { createAccountAndSession } from '@abx-utils/account'
import { updateOrCreateExchangeConfig } from '../../core'
import { updateCurrencyEnabledStatus } from '../test_utils'
import { SupportedFeatureFlags, CurrencyCode } from '@abx-types/reference-data'
import * as currencies from '../../core/symbols/currency_in_memory_cache'

describe('api:currencies', () => {
  let app
  let findAllCurrenciesStub

  beforeEach(async () => {
    findAllCurrenciesStub = sinon.stub(currencies, 'fetchAllCurrencies').callsFake(currencies.findCurrencies)

    app = bootstrapRestApi().listen(REFERENCE_DATA_REST_API_PORT)
    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, true)
  })

  afterEach(async () => {
    await updateOrCreateExchangeConfig({
      featureFlags: []
    })
    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, false)

    findAllCurrenciesStub.restore()

    await app.close()
  })

  it('retrieves all currencies includeOrderRange=false', async () => {
    const { body } = await makeRequest()

    verifyThatBodyHasCorrectProperties(body)
  })

  it('retrieves all currencies includeOrderRange=true', async () => {
    const { body } = await makeRequest(true)

    verifyThatBodyHasCorrectProperties(body, true)
  })

  it('retrieves all currencies feature flag enabled=false', async () => {
    await updateOrCreateExchangeConfig({
      featureFlags: [{name: SupportedFeatureFlags.bitcoin, enabled: false}]
    })
    const { body } = await makeRequest()

    expect(body).not.include.something.with.property('code', 'BTC')

    verifyThatBodyHasCorrectProperties(body)
  })

  it('retrieves all currencies feature flag enabled=true', async () => {
    await updateOrCreateExchangeConfig({
      featureFlags: [{name: SupportedFeatureFlags.bitcoin, enabled: true}]
    })
    const { body } = await makeRequest()

    expect(body).to.include.something.with.property('code', 'BTC')

    verifyThatBodyHasCorrectProperties(body)
  })

  it('retrieves all currencies feature flag enabled=[]', async () => {
    await updateOrCreateExchangeConfig({
      featureFlags: [{name: SupportedFeatureFlags.bitcoin, enabled: []}]
    })
    const { body } = await makeRequest()

    expect(body).not.include.something.with.property('code', 'BTC')

    verifyThatBodyHasCorrectProperties(body)
  })

  it('retrieves all currencies feature flag enabled array having user account', async () => {
    const { cookie, account } = await createAccountAndSession()
    await updateOrCreateExchangeConfig({
      featureFlags: [{name: SupportedFeatureFlags.bitcoin, enabled: [account.id]}]
    })
    const { body, status } = await request(app)
      .get('/api/currencies')
      .set('Cookie', cookie)
    expect(status).to.eql(200)
    expect(body).to.be.an('array')

    expect(body).to.include.something.with.property('code', 'BTC')

    verifyThatBodyHasCorrectProperties(body)
  })

  async function makeRequest(includeExtendedDetails: boolean = false) {
    const { cookie } = await createAccountAndSession()
    const { body, status } = await request(app)
      .get('/api/currencies')
      .query({ includeExtendedDetails })
      .set('Cookie', cookie)
    expect(status).to.eql(200)
    expect(body).to.be.an('array')

    return {
      body,
      status,
    }
  }

  function verifyThatBodyHasCorrectProperties(body, includeExtendedDetails: boolean = false) {
    body.forEach(currency => {
      expect(currency).to.be.an('object')
      expect(currency).to.have.property('code')

      if (includeExtendedDetails) {
        expect(currency).to.have.property('iconUrl')
        expect(currency).to.have.property('isFiat')
      }
    })
  }
})
