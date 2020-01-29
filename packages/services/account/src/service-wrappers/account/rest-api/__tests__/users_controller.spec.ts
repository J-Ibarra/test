import { expect } from 'chai'
import request from 'supertest'
import { bootstrapRestApi } from '..'
import { findOrCreateOperatorAccount } from '../../../../core'
import { createAccountAndSession } from '@abx-query-libs/account'
import { truncateTables } from '@abx-utils/db-connection-utils'

describe('api:users', () => {
  let app

  beforeEach(async () => {
    await truncateTables()
    await findOrCreateOperatorAccount()
    app = bootstrapRestApi()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('activate users', () => {
    it('fails with no cookie provided', async () => {
      const { body, status } = await request(app)
        .patch('/api/users/activate')
        .set('Accept', 'application/json')

      expect(status).to.eql(401)
      expect(Object.keys(body).length).to.eql(1)
    })

    it('fails with invalid cookie provided', async () => {
      const cookie = '111111'

      const { body, status } = await request(app)
        .patch('/api/users/activate')
        .set('Accept', 'application/json')
        .set('Cookie', cookie)

      expect(status).to.eql(401)
      expect(Object.keys(body).length).to.eql(1)
    })

    it('returns with success', async () => {
      const { cookie } = await createAccountAndSession()
      const { body, status } = await request(app)
        .patch('/api/users/activate')
        .set('Accept', 'application/json')
        .set('Cookie', cookie)

      expect(status).to.eql(204)
      expect(Object.keys(body).length).to.eql(0)
    })
  })
})
