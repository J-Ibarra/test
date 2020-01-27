import { expect } from 'chai'
import sinon from 'sinon'
import * as gtid from '../models/global_transaction_id'
import { CurrencyCode } from '@abx-types/reference-data'
import { AdminRequestStatus, AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { findAdminRequest, findAllAdminRequests, saveAdminRequest } from '..'
import { truncateTables, wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'

describe('requests_repository', () => {
  const adminRequestParams = {
    client: 'Foo Bar',
    hin: 'KM12313',
    type: AdminRequestType.redemption,
    description: '123 Foo',
    asset: CurrencyCode.usd,
    amount: 1231,
    fee: 11,
    admin: 'Admin A',
    status: AdminRequestStatus.pending,
    tradingPlatformName: 'foo',
  }

  before(async () => {
    sinon.stub(gtid, 'getNextGlobalTransactionId').callsFake(type => Promise.resolve(`${type}xxx`))
  })

  after(() => {
    sinon.restore()
  })

  afterEach(async () => await truncateTables())

  it('should save and retrieve admin requests', async () => {
    return wrapInTransaction(sequelize, null, async transaction => {
      await saveAdminRequest(adminRequestParams, transaction)
      await new Promise(resolve => setTimeout(() => resolve(), 100))
      const adminRequests = await findAllAdminRequests(transaction)
      expect(adminRequests.length).to.eql(1)

      const [redemptionRequest] = adminRequests
      expect(redemptionRequest).to.eql({
        ...adminRequestParams,
        id: redemptionRequest.id,
        globalTransactionId: `${AdminRequestType.redemption}xxx`,
        createdAt: redemptionRequest.createdAt,
        updatedAt: redemptionRequest.updatedAt,
        tradingPlatformName: redemptionRequest.tradingPlatformName,
      })
    })
  })

  it('should save and retrieve admin request for specific account hin', async () => {
    return wrapInTransaction(sequelize, null, async transaction => {
      const accountHin = 'KM12314'
      const adminRequestPersisted = await saveAdminRequest({ ...adminRequestParams, hin: accountHin }, transaction)

      console.log(JSON.stringify(adminRequestPersisted))
      const adminRequest = await findAdminRequest({ hin: accountHin }, transaction)

      expect(adminRequest!.client).to.eql(adminRequestParams.client)
    })
  })
})
