import { expect } from 'chai'
import sinon from 'sinon'
import * as gtid from '../../models/global_transaction_id'
import { truncateTables } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { AdminRequestStatus, AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { saveAdminRequest, rejectWithdrawalRequest } from '../..'
import * as withdrawalOperations from '@abx-service-clients/withdrawal'

describe('withdrawal_request_rejection_handler', () => {
  const adminRequestParams = {
    client: 'Foo Bar',
    hin: 'KM12313',
    type: AdminRequestType.withdrawal,
    description: '123 Foo',
    amount: 1231,
    fee: 11,
    admin: 'Admin A',
    status: AdminRequestStatus.pending,
    tradingPlatformName: 'foo',
  }

  before(async () => {
    sinon.stub(gtid, 'getNextGlobalTransactionId').callsFake(type => Promise.resolve(`${type}xxx`))
  })

  beforeEach(async () => {
    await truncateTables()
  })

  after(() => {
    sinon.restore()
  })

  it('should find and deny usd withdrawal admin request', async () => {
    const adminRequest = await saveAdminRequest({
      ...adminRequestParams,
      asset: CurrencyCode.usd,
    })

    const cancelFiatWithdrawalStub = sinon.stub(withdrawalOperations, 'cancelFiatWithdrawal')

    await rejectWithdrawalRequest(adminRequest, new Date())

    expect(cancelFiatWithdrawalStub.calledWith(adminRequest.id!)).to.eql(true)
  })
})
