import { expect } from 'chai'
import request from 'supertest'
import { bootstrapRestApi } from '../../rest-api'
import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'

describe('api:currencies', () => {
  let app

  beforeEach(async () => {
    app = bootstrapRestApi().listen(REFERENCE_DATA_REST_API_PORT)
  })

  afterEach(async () => {
    await app.close()
  })

  it('retrieves all currencies', async () => {
    const { body, status } = await request(app).get('/api/currencies')
    expect(status).to.eql(200)
    expect(body).to.be.an('array')

    body.forEach(currency => {
      expect(currency).to.be.an('object')
      expect(currency).to.have.property('code')
    })
  })
})
