import { expect } from 'chai'
import request from 'supertest'
import { bootstrapReferenceDataService } from '../../service_starter'

describe('api:currencies', () => {
  let app

  beforeEach(async () => {
    app = await bootstrapReferenceDataService()
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
