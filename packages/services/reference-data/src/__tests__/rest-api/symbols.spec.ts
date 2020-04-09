import { expect } from 'chai'
import sinon from 'sinon'
import request from 'supertest'
import { bootstrapRestApi } from '../../rest-api'
import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'
import { createAccountAndSession } from '@abx-utils/account'
import { SupportedFeatureFlags, CurrencyCode } from '@abx-types/reference-data'
import { updateOrCreateExchangeConfig, findCurrencyForCode } from '../../core'
import * as symbols from '../../core/symbols/symbol_in_memory_cache'
import * as currencies from '../../core/symbols/currency_in_memory_cache'
import { updateCurrencyEnabledStatus, updateSymbolsForCurrencyWithStatus } from '../test_utils'
import rewire from 'rewire'
const symbolsCache = rewire('../../core/symbols/symbol_in_memory_cache')

describe('api:symbols', () => {
  let app
  let findAllCurrenciesStub
  let fetchAllSymbolsStub

  beforeEach(async () => {
    fetchAllSymbolsStub = sinon.stub(symbols, 'fetchAllSymbols').callsFake(symbolsCache.fetchAllSymbols)
    findAllCurrenciesStub = sinon.stub(currencies, 'fetchAllCurrencies').callsFake(currencies.findCurrencies)
    app = bootstrapRestApi().listen(REFERENCE_DATA_REST_API_PORT)
    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, true)
    await updateSymbolsForCurrencyWithStatus(CurrencyCode.bitcoin, true)
  })

  afterEach(async () => {
    await updateOrCreateExchangeConfig({
      featureFlags: [],
    })
    await updateSymbolsForCurrencyWithStatus(CurrencyCode.bitcoin, false)
    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, false)

    findAllCurrenciesStub.restore()
    fetchAllSymbolsStub.restore()

    await app.close()
  })

  it('retrieves all symbols excluding orderRange enabled=true, BTC feature flag enabled', async () => {
    const currency = await findCurrencyForCode(CurrencyCode.bitcoin)
    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, false)
    await updateOrCreateExchangeConfig({
      featureFlags: [{ name: SupportedFeatureFlags.bitcoin, enabled: true }],
    })
    const { cookie } = await createAccountAndSession()
    const { body, status } = await request(app).get('/api/symbols').set('Cookie', cookie)

    expect(status).to.eql(200)
    expect(body).to.be.an('array')
    expect(body).to.have.lengthOf(21)

    body.forEach((symbol) => {
      expect(symbol).to.have.property('id')
      expect(symbol).to.have.property('base')
      expect(symbol).to.have.property('quote')
      expect(symbol).to.have.property('fee')
    })
    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, currency.isEnabled!)
  })

  it('retrieves all symbols excluding orderRange enabled=false', async () => {
    const currency = await findCurrencyForCode(CurrencyCode.bitcoin)
    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, false)
    await updateOrCreateExchangeConfig({
      featureFlags: [{ name: SupportedFeatureFlags.bitcoin, enabled: false }],
    })
    const { cookie } = await createAccountAndSession()
    const { body, status } = await request(app).get('/api/symbols').set('Cookie', cookie)

    expect(status).to.eql(200)
    expect(body).to.be.an('array')
    expect(body).to.have.lengthOf(15)

    body.forEach((symbol) => {
      expect(symbol).to.have.property('id')
      expect(symbol).to.have.property('base')
      expect(symbol).to.have.property('quote')
      expect(symbol).to.have.property('fee')
    })

    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, currency.isEnabled!)
  })

  it('retrieves all symbols including orderRange', async () => {
    const { cookie } = await createAccountAndSession()
    const { body, status } = await request(app).get('/api/symbols').query({ includeOrderRange: true }).set('Cookie', cookie)
    expect(status).to.eql(200)
    expect(body).to.be.an('array')
    expect(body).to.have.lengthOf(21)
    body.forEach((symbol) => {
      expect(symbol).to.have.property('id')
      expect(symbol).to.have.property('base')
      expect(symbol).to.have.property('quote')
      expect(symbol).to.have.property('fee')
      expect(symbol).to.have.property('orderRange')
    })
  })

  it('retrieves all symbols including sortOrder', async () => {
    const { cookie } = await createAccountAndSession()
    const { body, status } = await request(app).get('/api/symbols').set('Cookie', cookie)
    expect(status).to.eql(200)
    expect(body).to.be.an('array')
    expect(body).to.have.lengthOf(21)

    body.forEach((symbol) => {
      expect(symbol).to.have.property('id')
      expect(symbol).to.have.property('base')
      expect(symbol).to.have.property('quote')
      expect(symbol).to.have.property('fee')
      expect(symbol).to.have.property('sortOrder')
    })
  })
})
