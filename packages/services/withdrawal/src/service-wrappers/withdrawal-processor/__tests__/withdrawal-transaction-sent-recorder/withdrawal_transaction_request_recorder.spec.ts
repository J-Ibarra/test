import sinon from 'sinon'
import { expect } from 'chai'
import * as coreWithdrawalOperations from '../../../../core'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as blockchainOperations from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { recordWithdrawalOnChainTransaction } from '../../core/withdrawal-transaction-sent-recorder/withdrawal_transaction_request_recorder'
import * as withdrawalTransactionFeeOperations from '../../core/withdrawal-transaction-creation/kinesis_revenie_transaction_fee_reconciler'
import { WithdrawalState } from '@abx-types/withdrawal'
import * as asyncMessagePublisherOperations from '@abx-utils/async-message-publisher'
import { WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL } from '@abx-service-clients/withdrawal'

describe('withdrawal_transaction_request_recorder', () => {
  const withdrawalRequest = {
    id: 1,
    currencyId: 2,
    txHash: 'txHash',
  }
  const currencyМаnager = {
    getCurrencyFromTicker: () => ({}),
  }
  const withdrawalTransactionSentEvent = {
    withdrawalRequestId: withdrawalRequest.id,
    transactionFee: 1,
    transactionHash: withdrawalRequest.txHash,
  }

  beforeEach(() => {
    sinon.stub(blockchainOperations, 'getOnChainCurrencyManagerForEnvironment').returns(currencyМаnager)
  })

  afterEach(() => sinon.restore())

  it('should not do any processing when withdrawal request not found', async () => {
    sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequestByIdWithFeeRequest').resolves()
    const deductOnChainTransactionFeeFromRevenueBalanceStub = sinon
      .stub(withdrawalTransactionFeeOperations, 'deductOnChainTransactionFeeFromRevenueBalance')
      .resolves()

    try {
      await recordWithdrawalOnChainTransaction(withdrawalTransactionSentEvent)
    } catch (e) {
      expect(deductOnChainTransactionFeeFromRevenueBalanceStub.calledOnce).to.eql(false)
    }
  })

  it('should update withdrawal requests and deduct on chain transaction fee, no fee request', async () => {
    sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequestByIdWithFeeRequest').resolves(withdrawalRequest)
    sinon.stub(referenceDataOperations, 'findCryptoCurrencies').resolves([
      {
        id: 2,
        code: CurrencyCode.ethereum,
      },
    ])
    sinon.stub(referenceDataOperations, 'findCurrencyForId').resolves({
      id: 2,
      code: CurrencyCode.ethereum,
    })

    const deductOnChainTransactionFeeFromRevenueBalanceStub = sinon
      .stub(withdrawalTransactionFeeOperations, 'deductOnChainTransactionFeeFromRevenueBalance')
      .resolves()
    const updateWithdrawalRequestStub = sinon.stub(coreWithdrawalOperations, 'updateWithdrawalRequest').resolves()
    const sendAsyncChangeMessageStub = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()

    await recordWithdrawalOnChainTransaction(withdrawalTransactionSentEvent)

    expect(updateWithdrawalRequestStub.getCall(0).args[0]).to.eql({
      id: withdrawalRequest.id,
      txHash: withdrawalTransactionSentEvent.transactionHash,
      kinesisCoveredOnChainFee: withdrawalTransactionSentEvent.transactionFee,
      state: WithdrawalState.holdingsTransactionCompleted,
    })
    expect(
      deductOnChainTransactionFeeFromRevenueBalanceStub.calledWith(
        withdrawalRequest.id,
        withdrawalTransactionSentEvent.transactionFee,
        {},
        {
          id: 2,
          code: CurrencyCode.ethereum,
        },
      ),
    ).to.eql(true)
    expect(
      sendAsyncChangeMessageStub.calledWith({
        type: 'withdrawal-transaction-sent',
        target: {
          local: WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL!,
          deployedEnvironment: WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL!,
        },
        payload: {
          txid: withdrawalTransactionSentEvent.transactionHash,
          currency: CurrencyCode.ethereum,
        },
      }),
    ).to.eql(true)
  })

  it('should update withdrawal requests and deduct on chain transaction fee, with fee request', async () => {
    const feeRequestId = 2
    const feeCurrencyId = 3
    sinon.stub(coreWithdrawalOperations, 'findWithdrawalRequestByIdWithFeeRequest').resolves({
      ...withdrawalRequest,
      feeRequest: {
        id: feeRequestId,
        currencyId: feeCurrencyId,
      },
    })
    sinon.stub(referenceDataOperations, 'findCryptoCurrencies').resolves([
      {
        id: 2,
        code: CurrencyCode.ethereum,
      },
    ])
    sinon.stub(referenceDataOperations, 'findCurrencyForId').resolves({
      id: feeCurrencyId,
      code: CurrencyCode.ethereum,
    })

    const deductOnChainTransactionFeeFromRevenueBalanceStub = sinon
      .stub(withdrawalTransactionFeeOperations, 'deductOnChainTransactionFeeFromRevenueBalance')
      .resolves()
    const updateWithdrawalRequestStub = sinon.stub(coreWithdrawalOperations, 'updateWithdrawalRequest').resolves()
    const sendAsyncChangeMessageStub = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()
    await recordWithdrawalOnChainTransaction(withdrawalTransactionSentEvent)

    expect(updateWithdrawalRequestStub.getCall(0).args[0]).to.eql({
      id: withdrawalRequest.id,
      txHash: withdrawalTransactionSentEvent.transactionHash,
      kinesisCoveredOnChainFee: withdrawalTransactionSentEvent.transactionFee,
      state: WithdrawalState.holdingsTransactionCompleted,
    })
    expect(updateWithdrawalRequestStub.getCall(1).args[0]).to.eql({
      id: feeRequestId,
      state: WithdrawalState.holdingsTransactionCompleted,
    })
    expect(
      deductOnChainTransactionFeeFromRevenueBalanceStub.calledWith(
        withdrawalRequest.id,
        withdrawalTransactionSentEvent.transactionFee,
        {},
        {
          id: feeCurrencyId,
          code: CurrencyCode.ethereum,
        },
      ),
    ).to.eql(true)
    expect(
      sendAsyncChangeMessageStub.calledWith({
        type: 'withdrawal-transaction-sent',
        target: {
          local: WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL!,
          deployedEnvironment: WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL!,
        },
        payload: {
          txid: withdrawalTransactionSentEvent.transactionHash,
          currency: CurrencyCode.ethereum,
        },
      }),
    )
  })
})
