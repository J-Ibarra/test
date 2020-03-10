import sinon from 'sinon'
import { expect } from 'chai'
import * as coreWithdrawalOperations from '../../../../../core'
import * as orderOperations from '@abx-service-clients/order'
import * as balanceOperations from '@abx-service-clients/balance'

import { CurrencyCode } from '@abx-types/reference-data'
import * as accountOperations from '@abx-service-clients/account'
import { WithdrawalState } from '@abx-types/withdrawal'
import { TransactionDirection } from '@abx-types/order'
import { BalanceAsyncRequestType } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import Decimal from 'decimal.js'
import { completeCryptoWithdrawalWithSeparateFeeRequest } from '../../../core/withdrawal-completion/crypto/complete_withdrawal_with_fee_request'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'

describe('complete_withdrawal_with_fee_request', () => {
  const totalAmount = 12
  const withdrawalFee = 1
  const feeRequest = {
    id: 2,
    amount: 0.2,
    currencyId: 1,
    accountId: 'accIdFoo',
  }

  beforeEach(() => sinon.restore())
  afterEach(() => sinon.restore())

  it('should update withdrawal request status and trigger balance update', async () => {
    const withdrawalRequest = {
      id: 1,
      accountId: 'accidTest',
      currencyId: 12,
      currency: {
        code: CurrencyCode.bitcoin,
        id: 12,
      },
      feeRequest,
      amount: 10,
      kinesisCoveredOnChainFee: 1,
    } as any
    const kinesisRevenueAccount = { id: '12dasfa' }
    const updateWithdrawalRequestStub = sinon.stub(coreWithdrawalOperations, 'updateWithdrawalRequests').resolves(withdrawalRequest)
    sinon.stub(coreWithdrawalOperations, 'getTotalWithdrawalAmount').resolves(totalAmount)
    sinon.stub(coreWithdrawalOperations, 'getWithdrawalFee').resolves({ withdrawalFee })

    sinon.stub(accountOperations, 'findOrCreateKinesisRevenueAccount').resolves(kinesisRevenueAccount)
    const createCurrencyTransactionStub = sinon.stub(orderOperations, 'createCurrencyTransaction').resolves()
    const triggerMultipleBalanceChangesStub = sinon.stub(balanceOperations, 'triggerMultipleBalanceChanges').resolves()

    await wrapInTransaction(sequelize, null, async transaction => {
      await completeCryptoWithdrawalWithSeparateFeeRequest(withdrawalRequest, withdrawalRequest.feeRequest, transaction)
    })

    expect(updateWithdrawalRequestStub.getCall(0).args[0]).to.eql([withdrawalRequest.id!, feeRequest.id!])
    expect(updateWithdrawalRequestStub.getCall(0).args[1]).to.eql({
      state: WithdrawalState.completed,
    })

    expect(
      createCurrencyTransactionStub.calledWith({
        accountId: withdrawalRequest.accountId,
        amount: withdrawalRequest.amount,
        currencyId: withdrawalRequest.currencyId,
        direction: TransactionDirection.withdrawal,
        requestId: withdrawalRequest.id!,
      }),
    ).to.eql(true)
    expect(
      createCurrencyTransactionStub.calledWith({
        accountId: feeRequest.accountId,
        amount: feeRequest.amount,
        currencyId: feeRequest.currencyId,
        direction: TransactionDirection.withdrawal,
        requestId: feeRequest.id!,
      }),
    ).to.eql(true)

    expect(
      triggerMultipleBalanceChangesStub.calledWith([
        {
          type: BalanceAsyncRequestType.confirmPendingDeposit,
          payload: {
            accountId: kinesisRevenueAccount.id,
            amount: new Decimal(feeRequest.amount).minus(withdrawalRequest.kinesisCoveredOnChainFee!).toNumber(),
            currencyId: feeRequest.currencyId,
            sourceEventId: feeRequest.id!,
            sourceEventType: SourceEventType.currencyWithdrawalFee,
          },
        },
        {
          type: BalanceAsyncRequestType.confirmPendingWithdrawal,
          payload: {
            accountId: withdrawalRequest.accountId,
            amount: feeRequest.amount,
            currencyId: feeRequest.currencyId,
            sourceEventId: feeRequest.id!,
            sourceEventType: SourceEventType.currencyWithdrawalFee,
          },
        },
        {
          type: BalanceAsyncRequestType.confirmPendingWithdrawal,
          payload: {
            accountId: withdrawalRequest.accountId,
            amount: withdrawalRequest.amount,
            currencyId: withdrawalRequest.currencyId,
            sourceEventId: withdrawalRequest.id!,
            sourceEventType: SourceEventType.currencyWithdrawal,
          },
        },
      ]),
    ).to.eql(true)
  })
})

//
