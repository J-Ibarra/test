import sinon from 'sinon'
import { expect } from 'chai'
import * as coreWithdrawalOperations from '../../../../../core'
import * as orderOperations from '@abx-service-clients/order'
import * as balanceOperations from '@abx-service-clients/balance'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import * as accountOperations from '@abx-service-clients/account'
import { WithdrawalState } from '@abx-types/withdrawal'
import { TransactionDirection } from '@abx-types/order'
import { SourceEventType } from '@abx-types/balance'
import { completeFiatWithdrawalRequest } from '../../../core/withdrawal-completion/fiat/fiat_withdrawal_completer'

describe('fiat_withdrawal_completer', () => {
  const totalAmount = 12
  const withdrawalFee = 1
  const withdrawalRequest = {
    id: 1,
    accountId: 'accidTest',
    currencyId: 12,
    currency: {
      code: CurrencyCode.usd,
      id: 12,
    },
    amount: 10,
    kinesisCoveredOnChainFee: 1,
  } as any

  afterEach(() => sinon.restore())

  it('should update withdrawal request status and trigger balance update', async () => {
    const kinesisRevenueAccount = { id: '12dasfa' }
    const updateWithdrawalRequestStub = sinon.stub(coreWithdrawalOperations, 'updateWithdrawalRequest').resolves(withdrawalRequest)
    sinon.stub(coreWithdrawalOperations, 'getTotalWithdrawalAmount').resolves(totalAmount)
    sinon.stub(coreWithdrawalOperations, 'getWithdrawalFee').resolves({ withdrawalFee })
    sinon.stub(referenceDataOperations, 'findCurrencyForId').resolves({
      code: CurrencyCode.usd,
      id: 12,
    })

    sinon.stub(accountOperations, 'findOrCreateKinesisRevenueAccount').resolves(kinesisRevenueAccount)
    const createCurrencyTransactionStub = sinon.stub(orderOperations, 'createCurrencyTransaction').resolves()
    const updateAvailableStub = sinon.stub(balanceOperations, 'updateAvailable').resolves()

    await completeFiatWithdrawalRequest(withdrawalRequest, withdrawalFee)

    expect(updateWithdrawalRequestStub.getCall(0).args[0]).to.eql({ ...withdrawalRequest, state: WithdrawalState.completed })
    expect(
      createCurrencyTransactionStub.calledWith({
        accountId: withdrawalRequest.accountId,
        amount: totalAmount,
        currencyId: withdrawalRequest.currencyId,
        direction: TransactionDirection.withdrawal,
        requestId: withdrawalRequest.id!,
      }),
    ).to.eql(true)

    expect(
      updateAvailableStub.calledWith({
        accountId: kinesisRevenueAccount.id,
        amount: withdrawalFee,
        currencyId: withdrawalRequest.currencyId,
        sourceEventId: withdrawalRequest.id!,
        sourceEventType: SourceEventType.currencyWithdrawal,
      }),
    ).to.eql(true)

    expect(
      updateAvailableStub.calledWith({
        accountId: withdrawalRequest.accountId,
        amount: -totalAmount,
        currencyId: withdrawalRequest.currencyId,
        sourceEventId: withdrawalRequest.id!,
        sourceEventType: SourceEventType.currencyWithdrawal,
      }),
    ).to.eql(true)
  })
})
