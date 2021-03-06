import { expect } from 'chai'
import sinon from 'sinon'
import request from 'supertest'
import { CurrencyBoundary, CurrencyCode } from '@abx-types/reference-data'
import { Server } from 'http'
import { bootstrapRestApi } from '../../rest-api'
import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'
import * as currencies from '../../core/symbols/currency_in_memory_cache'
import { createAccountAndSession } from '@abx-utils/account'

describe('api:boundaries', () => {
  let app: Server
  let findAllCurrenciesStub
  
  beforeEach(async () => {
    findAllCurrenciesStub = sinon.stub(currencies, 'fetchAllCurrencies').callsFake(currencies.findCurrencies)
    app = bootstrapRestApi().listen(REFERENCE_DATA_REST_API_PORT)
  })

  afterEach(async () => {
    findAllCurrenciesStub.restore()
    await app.close()
  })

  it('retrieves all boundaries', async () => {
    const { cookie } = await createAccountAndSession()
    const { body: boundaryMap, status } = await request(app)
      .get('/api/boundaries')
      .set('Cookie', cookie)

    expect(status).to.eql(200)

    expect(boundaryMap).to.be.an('object')

    const boundaryCurrencyCodes = Object.keys(boundaryMap)

    expect(boundaryCurrencyCodes.length).to.equal(6)
    expect(boundaryCurrencyCodes).to.deep.equal(['KVT', 'USD', 'EUR', 'KAU', 'KAG', 'ETH'])

    const kvtBoundary: CurrencyBoundary = boundaryMap[CurrencyCode.kvt]

    expect(kvtBoundary.currencyCode).to.equal(CurrencyCode.kvt)
    expect(kvtBoundary.maxDecimals).to.equal(0)
    expect(kvtBoundary.minAmount).to.equal(1)
  })
})
