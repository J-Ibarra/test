import { expect } from 'chai'
import sinon from 'sinon'
import * as adminRequestOperations from '@abx-service-clients/admin-fund-management'
import { CurrencyCode } from '@abx-types/reference-data'
import { handleFiatCurrencyWithdrawalRequest } from '../../../framework'
import { WithdrawalRequestType, WithdrawalState } from '@abx-types/withdrawal'
import * as withdrawalOperations from '../../../lib'
import { withdrawalRequest } from '../test-utils'

const accountId = 'acc1'
const withdrawalAmount = 10
const feeRequest = { ...withdrawalRequest, id: 2, type: WithdrawalRequestType.fee }
const createdAt = new Date()

describe('fiat_new_withdrawal_request_handler', () => {
  afterEach(() => sinon.restore())

  it('should initialise fiat withdrawal and add create admin request when flag set to true', async () => {
    const withdrawalParams = {
      accountId,
      amount: withdrawalAmount,
      currencyCode: CurrencyCode.usd,
      memo: 'foo',
      transactionId: '1',
      transactionFee: 10,
      adminRequestId: 1,
    }
    const currency = { code: CurrencyCode.usd, id: 1, sortPriority: 1, orderPriority: 5 }

    const initialiseFiatWithdrawalRequestStub = sinon
      .stub(withdrawalOperations, 'initialiseFiatWithdrawalRequest')
      .resolves({ amountRequest: withdrawalRequest, feeRequest })

    const adminRequestId = 1
    const globalTransactionId = 2
    const saveAdminRequestStub = sinon
      .stub(adminRequestOperations, 'saveClientTriggeredFiatWithdrawalAdminRequest')
      .resolves(() => ({ id: adminRequestId, globalTransactionId, fee: 0 }))

    await handleFiatCurrencyWithdrawalRequest({
      params: withdrawalParams,
      currency,
      createdAt,
    })

    expect(initialiseFiatWithdrawalRequestStub.getCall(0).args[0]).to.eql({
      ...withdrawalParams,
      createdAt,
      state: WithdrawalState.pending,
    })
    expect(saveAdminRequestStub.getCall(0).args[0]).to.eql(accountId)
    expect(saveAdminRequestStub.getCall(0).args[1]).to.eql(CurrencyCode.usd)
    expect(saveAdminRequestStub.getCall(0).args[2]).to.eql(withdrawalAmount)
    expect(saveAdminRequestStub.getCall(0).args[3]).to.eql(withdrawalParams.memo)
  })

  it('should initialise fiat withdrawal and not create admin request when saveAdminRequest set to false', async () => {
    const withdrawalParams = {
      accountId,
      amount: withdrawalAmount,
      currencyCode: CurrencyCode.usd,
      memo: 'foo',
      transactionId: '1',
      transactionFee: 10,
      adminRequestId: 1,
    }
    const currency = { code: CurrencyCode.usd, id: 1, sortPriority: 1, orderPriority: 5 }

    const initialiseFiatWithdrawalRequestStub = sinon
      .stub(withdrawalOperations, 'initialiseFiatWithdrawalRequest')
      .resolves({ amountRequest: withdrawalRequest, feeRequest })
    const saveAdminRequestStub = sinon.stub(adminRequestOperations, 'saveClientTriggeredFiatWithdrawalAdminRequest').resolves()
    await handleFiatCurrencyWithdrawalRequest({
      params: withdrawalParams,
      currency,
      saveAdminRequest: false,
      createdAt,
    })

    expect(initialiseFiatWithdrawalRequestStub.getCall(0).args[0]).to.eql({
      ...withdrawalParams,
      createdAt,
      state: WithdrawalState.pending,
    })
    expect(saveAdminRequestStub.getCalls().length).to.eql(0)
  })
})
