import { bootstrapRestApi } from '..'
import request from 'supertest'
import sinon from 'sinon'
import { expect } from 'chai'
import { createAccountAndSession } from '../../../../../../../libs/util/account/src'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { DEPOSIT_API_PORT } from '@abx-service-clients/deposit'
import { Server } from 'http'
import { CurrencyCode } from '@abx-types/reference-data'

describe('DepositController', () => {
  let app: Server
  const minimumDepositAmountDictionary : Record<CurrencyCode, number> = {
    KAU: 1,
    KAG: 2,
    KVT: 3,
    ETH: 4,
    BTC: 5,
    USDT: 6,
    USD: 7,
    EUR: 8,
    GBP: 9
  } 

  beforeEach(async () => {
    sinon.stub(referenceDataOperations, 'getDepositMimimumAmounts')
      .resolves(minimumDepositAmountDictionary)

    app = bootstrapRestApi().listen(DEPOSIT_API_PORT)
  })

  afterEach(async () => {
    sinon.restore()
    await app.close()
  })

  it('should return the minimum deposit amount for each coin on GET /deposits/minimum-amounts', async () => {
    const { cookie } = await createAccountAndSession()

    const { body, status } = await request(app).get(`/api/deposits/minimum-amounts`).set('Cookie', cookie)

    expect(status).to.eql(200)
    expect(body).to.eql(minimumDepositAmountDictionary)
  })
})
