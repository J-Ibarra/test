import sinon from 'sinon'
import { expect } from 'chai'
import * as coreOperations from '../../../../../core'

import { CurrencyCode } from '@abx-types/reference-data'
import { DepositAddressNewTransactionQueuePoller } from '../../deposit-transaction-recording/DepositAddressNewTransactionQueuePoller'
import { DepositAddressTransactionHandler } from '../../deposit-transaction-recording/DepositAddressTransactionHandler'

describe('DepositAddressNewTransactionQueuePoller', () => {
  const depositAddressTransactionQueuePoller = new DepositAddressNewTransactionQueuePoller()
  const address = 'addressFoo'
  const transactionId = 'txId'
  const testDepositTransactionQueue = 'local-deposit-transaction-queue'
  let handleDepositAddressTransactionStub

  const depositRequest = {
    id: 1,
  } as any
  const depositAddress = {
    id: 1,
  } as any

  const transactionDetails = {
    transactionHash: 'txHash',
    receiverAddress: address,
    senderAddress: 'sender-address-2',
    amount: 3,
    time: new Date(),
  }

  beforeEach(() => {
    handleDepositAddressTransactionStub = sinon
      .stub(DepositAddressTransactionHandler.prototype, 'handleDepositAddressTransaction')
      .resolves(depositRequest)
    process.env.DEPOSIT_CONFIRMED_TRANSACTION_CALLBACK_URL = testDepositTransactionQueue
  })

  afterEach(() => sinon.restore())

  it('processDepositAddressTransaction should check if the transaction is for an ERC20 token', async () => {
    sinon.stub(coreOperations, 'findDepositAddressByAddressOrPublicKey').resolves(depositAddress)

    await depositAddressTransactionQueuePoller['processNewDepositAddressTransaction']({
      token_symbol: CurrencyCode.tether,
      address,
      txHash: transactionId,
    } as any)

    expect(
      handleDepositAddressTransactionStub.calledWith({
        currency: CurrencyCode.tether,
        depositAddress,
        depositTransactionDetails: transactionDetails,
      }),
    )
  })

  describe('processDepositAddressTransaction', () => {
    it('should not process transaction when deposit address not found', async () => {
      sinon.stub(coreOperations, 'findDepositAddress').resolves(null)

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction'](CurrencyCode.bitcoin, address, transactionId)
    })

    it('should process transaction when deposit address found', async () => {
      sinon.stub(coreOperations, 'findDepositAddressByAddressOrPublicKey').resolves(depositAddress)

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction'](CurrencyCode.bitcoin, address, transactionId)

      expect(handleDepositAddressTransactionStub.calledWith(transactionId, depositAddress, CurrencyCode.bitcoin))
    })
  })
})
