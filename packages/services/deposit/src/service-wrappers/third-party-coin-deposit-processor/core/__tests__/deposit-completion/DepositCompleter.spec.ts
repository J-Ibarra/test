import { DepositCompleter } from '../../deposit-completion/DepositCompleter'
import * as depositCoreOperations from '../../../../../core'
import * as orderOperations from '@abx-service-clients/order'
import * as balanceOperations from '@abx-service-clients/balance'
import * as referenceData from '@abx-service-clients/reference-data'
import * as accountClientOperations from '@abx-service-clients/account'
import * as utilsStub from '../../utils'

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
  let createCurrencyTransactionsStub
  let triggerMultipleBalanceChangesStub

  beforeEach(() => {
    updateDepositRequestStub = sinon.stub(depositCoreOperations, 'updateAllDepositRequests').resolves()
    createCurrencyTransactionsStub = sinon.stub(orderOperations, 'createCurrencyTransactions').resolves({ id: testData.currencyTransactionId })
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
      const feeCurrencyId = 2
      const sendDepositConfirmEmailStub = sinon.stub(depositCoreOperations, 'sendDepositConfirmEmail').resolves({ code: CurrencyCode.bitcoin })

      sinon.stub(utilsStub, 'getDepositTransactionFeeCurrencyId').resolves(feeCurrencyId)

      await depositCompleter.completeDepositRequests([testData.depositRequest], CurrencyCode.bitcoin)

      expect(updateDepositRequestStub.getCall(0).args[0]).to.eql([testData.depositRequest.id])
      expect(updateDepositRequestStub.getCall(0).args[1]).to.eql({ status: DepositRequestStatus.pendingHoldingsTransactionConfirmation })

      expect(
        createCurrencyTransactionsStub.calledWith([
          {
            accountId: testData.depositRequest.depositAddress.accountId,
            amount: testData.depositRequest.amount,
            currencyId: testData.depositRequest.depositAddress.currencyId,
            direction: TransactionDirection.deposit,
            requestId: testData.depositRequest.id!,
          },
        ]),
      ).to.eql(true)

      expect(
        triggerMultipleBalanceChangesStub.calledWith([
          {
            type: BalanceAsyncRequestType.confirmPendingDeposit,
            payload: {
              accountId: testData.depositRequest.depositAddress.accountId,
              amount: testData.depositRequest.amount,
              currencyId: testData.depositRequest.depositAddress.currencyId,
              sourceEventId: testData.depositRequest.id!,
              sourceEventType: SourceEventType.currencyDeposit,
            },
          },
          {
            type: BalanceAsyncRequestType.confirmPendingWithdrawal,
            payload: {
              accountId: testData.testKinesisRevenueAccount.id,
              amount: testData.holdingsTransactionFee,
              currencyId: feeCurrencyId,
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
      const feeCurrencyId = 3

      const preExistingDepositRequest = {
        id: -1,
        amount: preExistingDepositRequestAmount,
        depositAddress: testData.depositRequest.depositAddress,
        currencyId: testData.depositRequest.depositAddress.currencyId,
      }
      sinon.stub(utilsStub, 'getDepositTransactionFeeCurrencyId').resolves(feeCurrencyId)

      await depositCompleter.completeDepositRequests([preExistingDepositRequest, testData.depositRequest], CurrencyCode.bitcoin)

      expect(updateDepositRequestStub.getCall(0).args[0]).to.eql([preExistingDepositRequest.id, testData.depositRequest.id])
      expect(updateDepositRequestStub.getCall(0).args[1]).to.eql({ status: DepositRequestStatus.pendingHoldingsTransactionConfirmation })

      expect(
        createCurrencyTransactionsStub.calledWith([
          {
            accountId: preExistingDepositRequest.depositAddress.accountId,
            amount: preExistingDepositRequest.amount,
            currencyId: testData.depositRequest.depositAddress.currencyId,
            direction: TransactionDirection.deposit,
            requestId: preExistingDepositRequest.id!,
          },
          {
            accountId: testData.depositRequest.depositAddress.accountId,
            amount: testData.depositRequest.amount,
            currencyId: testData.depositRequest.depositAddress.currencyId,
            direction: TransactionDirection.deposit,
            requestId: testData.depositRequest.id!,
          },
        ]),
      ).to.eql(true)

      expect(
        triggerMultipleBalanceChangesStub.calledWith([
          {
            type: BalanceAsyncRequestType.confirmPendingDeposit,
            payload: {
              accountId: testData.depositRequest.depositAddress.accountId,
              amount: testData.depositRequest.amount + preExistingDepositRequest.amount,
              currencyId: testData.depositRequest.depositAddress.currencyId,
              sourceEventId: testData.depositRequest.id,
              sourceEventType: SourceEventType.currencyDeposit,
            },
          },
          {
            type: BalanceAsyncRequestType.confirmPendingWithdrawal,
            payload: {
              accountId: testData.testKinesisRevenueAccount.id,
              amount: testData.holdingsTransactionFee,
              currencyId: feeCurrencyId,
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
      expect(
        sendDepositConfirmEmailStub.calledWith(
          preExistingDepositRequest.depositAddress.accountId,
          preExistingDepositRequest.amount,
          CurrencyCode.bitcoin,
        ),
      ).to.eql(true)
    })
  })
})
