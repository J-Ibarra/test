import { expect } from 'chai'
import request from 'supertest'
import { bootstrap as bootstrapApi } from '../../bootstrap'

describe('api:symbols', () => {
  let app

  beforeEach(async () => {
    app = await bootstrapApi()
  })

  afterEach(async () => {
    await app.close()
  })

  it('retrieves all symbols excluding orderRange', async () => {
    const { body, status } = await request(app).get('/api/symbols')
    expect(status).to.eql(200)
    expect(body).to.be.an('array')
    expect(body).to.have.lengthOf(14)
    body.forEach(symbol => {
      expect(symbol).to.have.property('id')
      expect(symbol).to.have.property('base')
      expect(symbol).to.have.property('quote')
      expect(symbol).to.have.property('fee')
    })
  })

  it('retrieves all symbols including orderRange', async () => {
    const { body, status } = await request(app)
      .get('/api/symbols')
      .query({ includeOrderRange: true })
    expect(status).to.eql(200)
    expect(body).to.be.an('array')
    expect(body).to.have.lengthOf(14)
    body.forEach(symbol => {
      expect(symbol).to.have.property('id')
      expect(symbol).to.have.property('base')
      expect(symbol).to.have.property('quote')
      expect(symbol).to.have.property('fee')
      expect(symbol).to.have.property('orderRange')
    })
  })
  it('retrieves all symbols including sortOrder', async () => {
    const { body, status } = await request(app).get('/api/symbols')
    expect(status).to.eql(200)
    expect(body).to.be.an('array')
    expect(body).to.have.lengthOf(14)
    body.forEach(symbol => {
      expect(symbol).to.have.property('id')
      expect(symbol).to.have.property('base')
      expect(symbol).to.have.property('quote')
      expect(symbol).to.have.property('fee')
      expect(symbol).to.have.property('sortOrder')
    })
  })
})
