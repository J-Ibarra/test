import sinon from 'sinon'
import { expect } from 'chai'

import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as withdrawalCoreOperations from '../../../../core'
import * as withdrawalSentOperations from '../../core/withdrawal-transaction-creation/withdrawal-transaction-dispatcher'
import * as withdrawalValidatorOperations from '../../core/withdrawal-transaction-creation/withdrawal_status_validators'

import { CurrencyCode } from '@abx-types/reference-data'
import { processWaitingBitcoinWithdrawalRequests } from '../../core/withdrawal-transaction-creation/batch-processing/bitcoin_batch_withdrawal_transaction_creator'

describe('processWaitingBitcoinWithdrawalRequests', () => {
  const bitcoin = {
    id: 1,
    code: CurrencyCode.bitcoin,
  }
  const txHash = 'tx-hash-1'
  const averageFeePerReceiver = 10

  const onChainCurrencyGatewayStub = {
    transferFromExchangeHoldingsToMultipleReceivers: sinon.stub(),
  } as any

  afterEach(() => sinon.restore())

  it('should call transferFromExchangeHoldingsToMultipleReceivers for all waiting withdrawal requests', async () => {
    const withdrawalRequest1 = {
      id: 1,
      amount: 4,
      address: 'address-1',
    }
    const withdrawalRequest2 = {
      id: 2,
      amount: 5,
      address: 'address-5',
    }

    sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves(bitcoin)
    sinon.stub(withdrawalCoreOperations, 'findWithdrawalRequests').resolves([withdrawalRequest1, withdrawalRequest2])
    sinon.stub(withdrawalValidatorOperations, 'verifySufficientAmountInHoldingWallet').resolves()
    const transferFromExchangeHoldingsToMultipleReceiversStub = onChainCurrencyGatewayStub.transferFromExchangeHoldingsToMultipleReceivers.resolves({
      txHash,
      averageFeePerReceiver,
    })
    const recordTransactionSentStub = sinon.stub(withdrawalSentOperations, 'recordTransactionSent').resolves()

    await processWaitingBitcoinWithdrawalRequests(onChainCurrencyGatewayStub)
    expect(
      transferFromExchangeHoldingsToMultipleReceiversStub.calledWith({
        receivers: [
          {
            address: withdrawalRequest1.address,
            amount: withdrawalRequest1.amount,
          },
          {
            address: withdrawalRequest2.address,
            amount: withdrawalRequest2.amount,
          },
        ],
      }),
    ).to.eql(true)
    expect(recordTransactionSentStub.calledWith(withdrawalRequest1.id, txHash, averageFeePerReceiver)).to.eql(true)
    expect(recordTransactionSentStub.calledWith(withdrawalRequest2.id, txHash, averageFeePerReceiver)).to.eql(true)
  })
})
