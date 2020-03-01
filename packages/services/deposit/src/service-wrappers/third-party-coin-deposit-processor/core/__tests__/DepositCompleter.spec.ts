import { DepositCompleter } from '../deposit-completion/DepositCompleter'
import * as depositCoreOperations from '../../../../core'
import * as orderOperations from '@abx-service-clients/order'
import * as balanceOperations from '@abx-service-clients/balance'
import * as referenceData from '@abx-service-clients/reference-data'
import { expect } from 'chai'
import sinon from 'sinon'
import { TransactionDirection } from '@abx-types/order'
import { DepositRequestStatus } from '@abx-types/deposit'
import { SourceEventType } from '@abx-types/balance'
import { CurrencyCode } from '@abx-types/reference-data'

describe('DepositCompleter', () => {
  const depositCompleter = new DepositCompleter()
  const depositRequest = {
    id: 1,
    depositAddress: {
      currencyId: 1,
      accountId: 'acc-id-1',
    },
    amount: 10,
  } as any

  describe('completeDepositRequest', () => {
    it('should create transaction, confirm pending deposit balance and send confirmation email', async () => {
      const currencyTransactionId = 12

      const updateDepositRequestStub = sinon.stub(depositCoreOperations, 'updateDepositRequest').resolves()
      const createCurrencyTransactionStub = sinon.stub(orderOperations, 'createCurrencyTransaction').resolves({ id: currencyTransactionId })
      const confirmPendingDepositStub = sinon.stub(balanceOperations, 'confirmPendingDeposit').resolves()
      sinon.stub(referenceData, 'findCurrencyForId').resolves({
        id: depositRequest.depositAddress.currencyId,
        code: CurrencyCode.bitcoin,
      })
      const sendDepositConfirmEmailStub = sinon.stub(depositCoreOperations, 'sendDepositConfirmEmail').resolves({ code: CurrencyCode.bitcoin })

      await depositCompleter.completeDepositRequest(depositRequest)

      expect(updateDepositRequestStub.getCall(0).args[0]).to.eql(depositRequest.id)
      expect(updateDepositRequestStub.getCall(0).args[1]).to.eql({ status: DepositRequestStatus.completed })

      expect(
        createCurrencyTransactionStub.calledWith({
          accountId: depositRequest.depositAddress.accountId,
          amount: depositRequest.amount,
          currencyId: depositRequest.depositAddress.currencyId,
          direction: TransactionDirection.deposit,
          requestId: depositRequest.id!,
        }),
      ).to.eql(true)

      expect(
        confirmPendingDepositStub.calledWith({
          accountId: depositRequest.depositAddress.accountId,
          amount: depositRequest.amount,
          currencyId: depositRequest.depositAddress.currencyId,
          sourceEventId: currencyTransactionId,
          sourceEventType: SourceEventType.currencyDeposit,
        }),
      ).to.eql(true)

      expect(
        confirmPendingDepositStub.calledWith({
          accountId: depositRequest.depositAddress.accountId,
          amount: depositRequest.amount,
          currencyId: depositRequest.depositAddress.currencyId,
          sourceEventId: currencyTransactionId,
          sourceEventType: SourceEventType.currencyDeposit,
        }),
      ).to.eql(true)

      expect(sendDepositConfirmEmailStub.calledWith(depositRequest.depositAddress.accountId, depositRequest.amount, CurrencyCode.bitcoin)).to.eql(
        true,
      )
    })
  })
})
