import { DepositCompleter } from '../deposit-completion/DepositCompleter'
import * as depositCoreOperations from '../../../../core'
import * as orderOperations from '@abx-service-clients/order'
import * as balanceOperations from '@abx-service-clients/balance'
import * as referenceData from '@abx-service-clients/reference-data'
import * as accountClientOperations from '@abx-service-clients/account'
import { expect } from 'chai'
import sinon from 'sinon'
import { TransactionDirection } from '@abx-types/order'
import { DepositRequestStatus } from '@abx-types/deposit'
import { SourceEventType } from '@abx-types/balance'
import { CurrencyCode } from '@abx-types/reference-data'
import { BalanceAsyncRequestType } from '@abx-service-clients/balance'
import * as testData from './DepositCompleter.utils'

describe('DepositCompleter', () => {
  const depositCompleter = new DepositCompleter()
  let updateDepositRequestStub
  let createCurrencyTransactionStub
  let triggerMultipleBalanceChangesStub

  beforeEach(() => {
    updateDepositRequestStub = sinon.stub(depositCoreOperations, 'updateAllDepositRequests').resolves()
    createCurrencyTransactionStub = sinon.stub(orderOperations, 'createCurrencyTransaction').resolves({ id: testData.currencyTransactionId })
    sinon.stub(accountClientOperations, 'findOrCreateKinesisRevenueAccount').resolves(testData.testKinesisRevenueAccount)
    triggerMultipleBalanceChangesStub = sinon.stub(balanceOperations, 'triggerMultipleBalanceChanges').resolves()
    sinon.stub(referenceData, 'findCurrencyForId').resolves({
      id: testData.depositRequest.depositAddress.currencyId,
      code: CurrencyCode.bitcoin,
    })
  })

  afterEach(() => sinon.restore())

  describe('completeDepositRequest:single-request', () => {
    it('should create transaction, confirm pending deposit balance and send confirmation email', async () => {
      const sendDepositConfirmEmailStub = sinon.stub(depositCoreOperations, 'sendDepositConfirmEmail').resolves({ code: CurrencyCode.bitcoin })

      await depositCompleter.completeDepositRequests([testData.depositRequest])

      expect(updateDepositRequestStub.getCall(0).args[0]).to.eql([testData.depositRequest.id])
      expect(updateDepositRequestStub.getCall(0).args[1]).to.eql({ status: DepositRequestStatus.completed })

      expect(
        createCurrencyTransactionStub.calledWith({
          accountId: testData.depositRequest.depositAddress.accountId,
          amount: testData.depositRequest.amount,
          currencyId: testData.depositRequest.depositAddress.currencyId,
          direction: TransactionDirection.deposit,
          requestId: testData.depositRequest.id!,
        }),
      ).to.eql(true)

      expect(
        triggerMultipleBalanceChangesStub.calledWith([
          {
            type: BalanceAsyncRequestType.confirmPendingDeposit,
            payload: {
              accountId: testData.depositRequest.depositAddress.accountId,
              amount: testData.depositRequest.amount,
              currencyId: testData.depositRequest.depositAddress.currencyId,
              sourceEventId: testData.currencyTransactionId!,
              sourceEventType: SourceEventType.currencyDeposit,
            },
          },
          {
            type: BalanceAsyncRequestType.confirmPendingWithdrawal,
            payload: {
              accountId: testData.testKinesisRevenueAccount.id,
              amount: testData.holdingsTransactionFee,
              currencyId: testData.depositRequest.depositAddress.currencyId,
              sourceEventId: testData.depositRequest.id,
              sourceEventType: SourceEventType.currencyDeposit,
            },
          },
        ]),
      ).to.eql(true)

      expect(
        sendDepositConfirmEmailStub.calledWith(
          testData.depositRequest.depositAddress.accountId,
          testData.depositRequest.amount,
          CurrencyCode.bitcoin,
        ),
      ).to.eql(true)
    })
  })

  describe('completeDepositRequest:multiple-requests', () => {
    it('should create transaction, confirm pending deposit balance and send confirmation email', async () => {
      const sendDepositConfirmEmailStub = sinon.stub(depositCoreOperations, 'sendDepositConfirmEmail').resolves({ code: CurrencyCode.bitcoin })
      const preExistingDepositRequestAmount = 0.00002

      const preExistingDepositRequest = {
        id: -1,
        amount: preExistingDepositRequestAmount,
        depositAddress: testData.depositRequest.depositAddress,
      }
      await depositCompleter.completeDepositRequests([preExistingDepositRequest, testData.depositRequest])

      expect(updateDepositRequestStub.getCall(0).args[0]).to.eql([preExistingDepositRequest.id, testData.depositRequest.id])
      expect(updateDepositRequestStub.getCall(0).args[1]).to.eql({ status: DepositRequestStatus.completed })

      expect(
        createCurrencyTransactionStub.calledWith({
          accountId: testData.depositRequest.depositAddress.accountId,
          amount: testData.depositRequest.amount + preExistingDepositRequest.amount,
          currencyId: testData.depositRequest.depositAddress.currencyId,
          direction: TransactionDirection.deposit,
          requestId: testData.depositRequest.id!,
        }),
      ).to.eql(true)

      expect(
        triggerMultipleBalanceChangesStub.calledWith([
          {
            type: BalanceAsyncRequestType.confirmPendingDeposit,
            payload: {
              accountId: testData.depositRequest.depositAddress.accountId,
              amount: testData.depositRequest.amount + preExistingDepositRequest.amount,
              currencyId: testData.depositRequest.depositAddress.currencyId,
              sourceEventId: testData.currencyTransactionId!,
              sourceEventType: SourceEventType.currencyDeposit,
            },
          },
          {
            type: BalanceAsyncRequestType.confirmPendingWithdrawal,
            payload: {
              accountId: testData.testKinesisRevenueAccount.id,
              amount: testData.holdingsTransactionFee,
              currencyId: testData.depositRequest.depositAddress.currencyId,
              sourceEventId: testData.depositRequest.id,
              sourceEventType: SourceEventType.currencyDeposit,
            },
          },
        ]),
      ).to.eql(true)

      expect(
        sendDepositConfirmEmailStub.calledWith(
          testData.depositRequest.depositAddress.accountId,
          testData.depositRequest.amount + preExistingDepositRequest.amount,
          CurrencyCode.bitcoin,
        ),
      ).to.eql(true)
    })
  })
})
