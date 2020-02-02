import { expect } from 'chai'
import request from 'supertest'
import { bootstrapRestApi, REST_API_PORT } from '../../rest-api'

describe('api:currencies', () => {
  let app

  beforeEach(async () => {
    app = bootstrapRestApi().listen(REST_API_PORT)
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
