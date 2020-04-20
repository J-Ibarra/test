import { bootstrapRestApi } from '..'
import request from 'supertest'
import { expect } from 'chai'
import { createAccountAndSession } from '../../../../../../../libs/util/account/src'
import { minimumDepositAmountDictionary } from '../../../../core'
import { DEPOSIT_API_PORT } from '@abx-service-clients/deposit'
import { Server } from 'http'

describe('DepositController', () => {
  let app: Server

  beforeEach(async () => {
    app = bootstrapRestApi().listen(DEPOSIT_API_PORT)
  })

  afterEach(async () => {
    await app.close()
  })

  it('should return the minimum deposit amount for each coin on GET /deposits/minimum-amounts', async () => {
    const { cookie } = await createAccountAndSession()

    const { body, status } = await request(app).get(`/api/deposits/minimum-amounts`).set('Cookie', cookie)

    expect(status).to.eql(200)
    expect(body).to.eql(minimumDepositAmountDictionary)
  })
})
