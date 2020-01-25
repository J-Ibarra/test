import { expect } from 'chai'
import sinon from 'sinon'
import * as accountOperations from '@abx-service-clients/account'
import { CurrencyCode } from '@abx-types/reference-data'
import {
  CryptoWithdrawalGatekeeper,
  deductOnChainTransactionFeeFromRevenueBalance,
  transferCryptoForLatestWithdrawalRequest,
} from '../../../framework'
import * as withdrawalTransferOperations from '../../../framework/cryto-transfer/crypto_funds_transferrer'
import { WithdrawalState } from '@abx-types/withdrawal'
import * as withdrawalOperations from '../../../lib'
import { cryptoWithdrawalRequest, currencyToWithdrawalRequestsKey, withdrawalRequest } from '../test-utils'
import * as balanceOperations from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'

const testTxHash = '1231312312312'
const testTransactionFee = '123'
const feeRequest = {
  ...cryptoWithdrawalRequest,
  id: 2,
}

describe('crypto_withdrawal_transfer_handler:transferCryptoForLatestWithdrawalRequest', () => {
  let pendingHoldingsAccountTransferGatekeeper: CryptoWithdrawalGatekeeper
  let pendingCompletionGatekeeper: CryptoWithdrawalGatekeeper
  let manager

  beforeEach(() => {
    pendingHoldingsAccountTransferGatekeeper = new CryptoWithdrawalGatekeeper('test')
    pendingCompletionGatekeeper = new CryptoWithdrawalGatekeeper('test completion')
  })

  afterEach(() => sinon.restore())

  it('should not do any processing when no request in pendingHoldingsAccountTransferGatekeeper', async () => {
    const getCurrencyFromTicker = sinon.mock()
    manager = {
      getCurrencyFromTicker,
    }

    await transferCryptoForLatestWithdrawalRequest(CurrencyCode.kag, manager, pendingHoldingsAccountTransferGatekeeper, pendingCompletionGatekeeper)
    expect(getCurrencyFromTicker.getCalls().length).to.eql(0)
  })

  it('should add request to pendingHoldingsAccountTransferGatekeeper for later processing when currency transfer throws error', async () => {
    const getCurrencyFromTicker = sinon.mock().resolves({})
    manager = {
      getCurrencyFromTicker,
    }
    pendingHoldingsAccountTransferGatekeeper.addNewWithdrawalRequestForCurrency(CurrencyCode.kag, {
      withdrawalRequest: cryptoWithdrawalRequest,
    })

    sinon.stub(withdrawalOperations, 'findAndLockWithdrawalRequestById').resolves(cryptoWithdrawalRequest)
    sinon.stub(withdrawalTransferOperations, 'withdrawFundsFromHoldingsAccountToTargetAddress').rejects('Failure')

    await transferCryptoForLatestWithdrawalRequest(CurrencyCode.kag, manager, pendingHoldingsAccountTransferGatekeeper, pendingCompletionGatekeeper)
    expect(getCurrencyFromTicker.calledWith(CurrencyCode.kag)).to.eql(true)
    expect(pendingHoldingsAccountTransferGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kag)![0].withdrawalRequest).to.eql(
      cryptoWithdrawalRequest,
    )
    expect(pendingHoldingsAccountTransferGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kag)![0].lockedUntil).to.not.eql(undefined)
  })

  describe('should update only withdrawal request and add to pendingCompletionGatekeeper', () => {
    beforeEach(() => {
      const getCurrencyFromTicker = sinon.mock().resolves({})
      manager = {
        getCurrencyFromTicker,
      }
    })

    it('no fee request', async () => {
      pendingHoldingsAccountTransferGatekeeper.addNewWithdrawalRequestForCurrency(CurrencyCode.kag, {
        withdrawalRequest: cryptoWithdrawalRequest,
      })
      sinon
        .stub(withdrawalOperations, 'findAndLockWithdrawalRequestById')
        .resolves({ ...cryptoWithdrawalRequest, currency: { id: 2, code: CurrencyCode.kag, sortPriority: 3, orderPriority: 2 } })
      sinon
        .stub(withdrawalTransferOperations, 'withdrawFundsFromHoldingsAccountToTargetAddress')
        .resolves({ txHash: testTxHash, transactionFee: testTransactionFee })
      const withdrawalUpdateStub = sinon.stub(withdrawalOperations, 'updateWithdrawalRequest').callsFake(request => Promise.resolve(request) as any)

      await transferCryptoForLatestWithdrawalRequest(CurrencyCode.kag, manager, pendingHoldingsAccountTransferGatekeeper, pendingCompletionGatekeeper)

      expect(withdrawalUpdateStub.getCall(0).args[0]).to.eql({
        id: withdrawalRequest.id,
        txHash: testTxHash,
        kinesisCoveredOnChainFee: 0,
        state: WithdrawalState.holdingsTransactionCompleted,
      })

      const pendingCompletionWithdrawal = pendingCompletionGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kag)![0]

      expect(pendingCompletionWithdrawal.lockedUntil).to.not.eql(undefined)
      expect(pendingCompletionWithdrawal.withdrawalRequest).to.eql({
        id: cryptoWithdrawalRequest.id,
        currency: cryptoWithdrawalRequest.currency,
        txHash: testTxHash,
        kinesisCoveredOnChainFee: 0,
        state: WithdrawalState.holdingsTransactionCompleted,
      })
      expect(pendingCompletionWithdrawal.feeRequest).to.eql(undefined)
    })

    it('with fee request', async () => {
      pendingHoldingsAccountTransferGatekeeper.addNewWithdrawalRequestForCurrency(CurrencyCode.kag, {
        withdrawalRequest: cryptoWithdrawalRequest,
        feeRequest,
      })
      sinon
        .stub(withdrawalOperations, 'findAndLockWithdrawalRequestById')
        .resolves({ ...cryptoWithdrawalRequest, currency: { id: 2, code: CurrencyCode.kag, sortPriority: 3, orderPriority: 2 } })

      sinon
        .stub(withdrawalTransferOperations, 'withdrawFundsFromHoldingsAccountToTargetAddress')
        .resolves({ txHash: testTxHash, transactionFee: testTransactionFee })
      const withdrawalUpdateStub = sinon.stub(withdrawalOperations, 'updateWithdrawalRequest').callsFake(request => Promise.resolve(request) as any)

      await transferCryptoForLatestWithdrawalRequest(CurrencyCode.kag, manager, pendingHoldingsAccountTransferGatekeeper, pendingCompletionGatekeeper)

      expect(withdrawalUpdateStub.getCall(0).args[0]).to.eql({
        id: withdrawalRequest.id,
        txHash: testTxHash,
        kinesisCoveredOnChainFee: 0,
        state: WithdrawalState.holdingsTransactionCompleted,
      })
      expect(withdrawalUpdateStub.getCall(1).args[0]).to.eql({
        id: feeRequest.id,
        state: WithdrawalState.holdingsTransactionCompleted,
      })

      const pendingCompletionWithdrawal = pendingCompletionGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kag)![0]

      expect(pendingCompletionWithdrawal.lockedUntil).to.not.eql(undefined)
      expect(pendingCompletionWithdrawal.withdrawalRequest).to.eql({
        id: cryptoWithdrawalRequest.id,
        currency: cryptoWithdrawalRequest.currency,
        txHash: testTxHash,
        kinesisCoveredOnChainFee: 0,
        state: WithdrawalState.holdingsTransactionCompleted,
      })
      expect(pendingCompletionWithdrawal.feeRequest).to.eql({
        id: feeRequest.id,
        currency: cryptoWithdrawalRequest.currency,
        state: WithdrawalState.holdingsTransactionCompleted,
      })
    }).timeout(60_000)
  })

  describe('deductOnChainTransactionFeeFromRevenueBalance', () => {
    const kinesisRevenueAccountId = '123'
    const feeCurrencyId = 1
    let denyPendingDepositStub

    beforeEach(() => {
      sinon.stub(accountOperations, 'findOrCreateKinesisRevenueAccount').resolves({ id: kinesisRevenueAccountId })

      denyPendingDepositStub = sinon.stub(balanceOperations, 'denyPendingDeposit')
    })

    describe('KVT or ETH', () => {
      it('should execute deduction logic when currency ETH', async () => {
        await deductOnChainTransactionFeeFromRevenueBalance(
          cryptoWithdrawalRequest,
          +testTransactionFee,
          { ticker: CurrencyCode.ethereum } as any,
          feeCurrencyId,
        )

        expect(
          denyPendingDepositStub.calledWith({
            accountId: kinesisRevenueAccountId,
            amount: +testTransactionFee,
            currencyId: feeCurrencyId,
            sourceEventId: cryptoWithdrawalRequest.id,
            sourceEventType: SourceEventType.currencyWithdrawal,
          }),
        ).to.eql(true)
      })

      it('should execute deduction logic when currency KVT', async () => {
        await deductOnChainTransactionFeeFromRevenueBalance(
          cryptoWithdrawalRequest,
          +testTransactionFee,
          { ticker: CurrencyCode.kvt } as any,
          feeCurrencyId,
        )

        expect(
          denyPendingDepositStub.calledWith({
            accountId: kinesisRevenueAccountId,
            amount: +testTransactionFee,
            currencyId: feeCurrencyId,
            sourceEventId: cryptoWithdrawalRequest.id,
            sourceEventType: SourceEventType.currencyWithdrawal,
          }),
        ).to.eql(true)
      })

      it(' should not execute any logic when not KVT or ETH', async () => {
        await deductOnChainTransactionFeeFromRevenueBalance(
          cryptoWithdrawalRequest,
          +testTransactionFee,
          { ticker: CurrencyCode.kau } as any,
          feeCurrencyId,
        )

        expect(denyPendingDepositStub.getCalls().length).to.eql(0)
      })
    })
  })
})
