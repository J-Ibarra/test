import sinon from 'sinon'
import { expect } from 'chai'
import * as coreWithdrawalOperations from '../../../../../core'
import * as orderOperations from '@abx-service-clients/order'
import * as balanceOperations from '@abx-service-clients/balance'

import { CurrencyCode } from '@abx-types/reference-data'
import { completeNoFeeRequestCryptoWithdrawal } from '../../../core/withdrawal-completion/crypto/complete_no_fee_request_withdrawal'
import * as accountOperations from '@abx-service-clients/account'
import { WithdrawalState } from '@abx-types/withdrawal'
import { TransactionDirection } from '@abx-types/order'
import { BalanceAsyncRequestType } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import Decimal from 'decimal.js'

describe('complete_no_fee_request_withdrawal', () => {
  const totalAmount = 12
  const withdrawalFee = 1
  const withdrawalRequest = {
    id: 1,
    accountId: 'accidTest',
    currencyId: 12,
    currency: {
      code: CurrencyCode.bitcoin,
      id: 12,
    },
    amount: 10,
    kinesisCoveredOnChainFee: 1,
  } as any

  it('should update withdrawal request status and trigger balance update', async () => {
    const kinesisRevenueAccount = { id: '12dasfa' }
    const updateWithdrawalRequestStub = sinon.stub(coreWithdrawalOperations, 'updateWithdrawalRequest').resolves(withdrawalRequest)
    sinon.stub(coreWithdrawalOperations, 'getTotalWithdrawalAmount').resolves(totalAmount)
    sinon.stub(coreWithdrawalOperations, 'getWithdrawalFee').resolves({ withdrawalFee })

    sinon.stub(accountOperations, 'findOrCreateKinesisRevenueAccount').resolves(kinesisRevenueAccount)
    const createCurrencyTransactionStub = sinon.stub(orderOperations, 'createCurrencyTransaction').resolves()
    const triggerMultipleBalanceChangesStub = sinon.stub(balanceOperations, 'triggerMultipleBalanceChanges').resolves()

    await completeNoFeeRequestCryptoWithdrawal(withdrawalRequest)

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
      triggerMultipleBalanceChangesStub.calledWith([
        {
          type: BalanceAsyncRequestType.confirmPendingDeposit,
          payload: {
            accountId: kinesisRevenueAccount.id,
            amount: new Decimal(withdrawalFee).minus(withdrawalRequest.kinesisCoveredOnChainFee!).toNumber(),
            currencyId: withdrawalRequest.currencyId,
            sourceEventId: withdrawalRequest.id!,
            sourceEventType: SourceEventType.currencyWithdrawal,
          },
        },
        {
          type: BalanceAsyncRequestType.confirmPendingWithdrawal,
          payload: {
            accountId: withdrawalRequest.accountId,
            amount: totalAmount,
            currencyId: withdrawalRequest.currencyId,
            sourceEventId: withdrawalRequest.id!,
            sourceEventType: SourceEventType.currencyWithdrawal,
          },
        },
      ]),
    ).to.eql(true)
  })
})
