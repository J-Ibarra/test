import sinon from 'sinon'
import { expect } from 'chai'

import * as referenceDataOperations from '@abx-service-clients/reference-data'
import {
  dispatchWithdrawalTransaction,
  INSUFFICIENT_UTXO_ERROR_CODE,
} from '../../core/withdrawal-transaction-creation/withdrawal-transaction-dispatcher'
import * as asyncMessagePublisherOperations from '@abx-utils/async-message-publisher'
import { WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL } from '@abx-service-clients/withdrawal'
import { CurrencyCode } from '@abx-types/reference-data'
import * as kinesisCurrencyTransferrer from '../../core/withdrawal-transaction-creation/kinesis_currency_transferrer'
import * as coreOperations from '../../../../core'
import { WithdrawalState } from '@abx-types/withdrawal'

describe('withdrawal-transaction-dispatcher', () => {
  const withdrawalTargetAddress = 'tgrAddress'
  const withdrawalAmount = 29
  const transferFromExchangeHoldingsToStub = sinon.stub()
  let onChainCurrencyGateway
  const memo = 'withdrawal-memo'
  const withdrawalRequestId = 1

  const transactionFee = 1
  const withdrawalFeeAmount = 0.5
  const transactionFeeCap = 0.0003
  const transactionFeeIncrement = 0.00000005
  const txHash = 'dacxv123das'

  beforeEach(() => {
    onChainCurrencyGateway = {
      transferFromExchangeHoldingsTo: transferFromExchangeHoldingsToStub,
    } as any
  })
  afterEach(() => sinon.restore())

  it('dispatchWithdrawalRequest should transfer funds and queue withdrawal transaction sent message, kinesis coin', async () => {
    onChainCurrencyGateway.ticker = CurrencyCode.kau
    const transferWithdrawalFundsForKinesisCurrencyStub = sinon
      .stub(kinesisCurrencyTransferrer, 'transferWithdrawalFundsForKinesisCurrency')
      .resolves({ txHash, transactionFee })
    sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
      feeAmount: withdrawalFeeAmount,
    })
    const sendAsyncChangeMessageStub = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()

    await dispatchWithdrawalTransaction(withdrawalRequestId, withdrawalTargetAddress, withdrawalAmount, onChainCurrencyGateway, memo)

    expect(transferWithdrawalFundsForKinesisCurrencyStub.getCall(0).args[0]).to.eql({
      withdrawalRequestId,
      kinesisCurrencyGateway: onChainCurrencyGateway,
      targetAddress: withdrawalTargetAddress,
      amount: withdrawalAmount,
      memo,
    })
    expect(
      sendAsyncChangeMessageStub.calledWith({
        id: `withdrawal-completion-pending-${txHash}`,
        type: 'withdrawal-transaction-sent',
        target: {
          local: WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL!,
          deployedEnvironment: WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL!,
        },
        payload: {
          withdrawalRequestId: withdrawalRequestId,
          transactionHash: txHash,
          transactionFee,
        },
      }),
    )
  })

  it('dispatchWithdrawalRequest should transfer funds and queue withdrawal transaction sent message, non-kinesis coin', async () => {
    onChainCurrencyGateway.ticker = CurrencyCode.ethereum

    transferFromExchangeHoldingsToStub.resolves({ txHash, transactionFee })
    const sendAsyncChangeMessageStub = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()

    sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
      feeAmount: withdrawalFeeAmount,
      transactionFeeCap,
      transactionFeeIncrement,
    })

    await dispatchWithdrawalTransaction(withdrawalRequestId, withdrawalTargetAddress, withdrawalAmount, onChainCurrencyGateway, memo)

    expect(
      onChainCurrencyGateway.transferFromExchangeHoldingsTo.calledWith({
        toAddress: withdrawalTargetAddress,
        amount: withdrawalAmount,
        memo,
        feeLimit: transactionFeeCap,
        transactionFeeIncrement: transactionFeeIncrement,
      }),
    ).to.eql(true)
    expect(
      sendAsyncChangeMessageStub.calledWith({
        id: `withdrawal-completion-pending-${txHash}`,
        type: 'withdrawal-transaction-sent',
        target: {
          local: WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL!,
          deployedEnvironment: WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL!,
        },
        payload: {
          withdrawalRequestId: withdrawalRequestId,
          transactionHash: txHash,
          transactionFee,
        },
      }),
    )
  })

  it('dispatchWithdrawalRequest should update withdrawal status to waiting if BTC transaction creation fails due to unconfirmed UTXOs', async () => {
    onChainCurrencyGateway.ticker = CurrencyCode.bitcoin

    transferFromExchangeHoldingsToStub.throws({
      meta: {
        error: {
          code: INSUFFICIENT_UTXO_ERROR_CODE,
        },
      },
    })
    const sendAsyncChangeMessageStub = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()
    const updateWithdrawalRequestStub = sinon.stub(coreOperations, 'updateWithdrawalRequest').resolves()

    sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
      feeAmount: withdrawalFeeAmount,
      transactionFeeCap,
      transactionFeeIncrement,
    })

    await dispatchWithdrawalTransaction(withdrawalRequestId, withdrawalTargetAddress, withdrawalAmount, onChainCurrencyGateway, memo)

    expect(
      onChainCurrencyGateway.transferFromExchangeHoldingsTo.calledWith({
        toAddress: withdrawalTargetAddress,
        amount: withdrawalAmount,
        memo,
        feeLimit: transactionFeeCap,
        transactionFeeIncrement: transactionFeeIncrement,
      }),
    ).to.eql(true)
    expect(sendAsyncChangeMessageStub.calledOnce).to.eql(false)
    expect(
      updateWithdrawalRequestStub.calledWith({
        state: WithdrawalState.waiting,
        id: withdrawalRequestId,
      }),
    ).to.eql(true)
  })
})
