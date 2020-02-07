import { expect } from 'chai'
import request from 'supertest'
import { CurrencyBoundary, CurrencyCode } from '@abx-types/reference-data'
import { Server } from 'http'
import { bootstrapRestApi } from '../../rest-api'
import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'

describe('api:boundaries', () => {
  let app: Server

  beforeEach(async () => {
    app = bootstrapRestApi().listen(REFERENCE_DATA_REST_API_PORT)
  })

  afterEach(async () => {
    await app.close()
  })

  it('retrieves all boundaries', async () => {
    const { body: boundaryMap, status } = await request(app).get('/api/boundaries')

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
