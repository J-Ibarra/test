import sinon from 'sinon'
import { expect } from 'chai'
import * as coreOperations from '../../../../core'
import * as blockchainCurrencyGateway from '@abx-utils/blockchain-currency-gateway'

import { CurrencyCode } from '@abx-types/reference-data'
import { DepositAddressNewTransactionQueuePoller } from '../deposit-transaction-recording/DepositAddressNewTransactionQueuePoller'
import { NewTransactionRecorder } from '../../core/deposit-transaction-recording/NewTransactionRecorder'

describe('DepositAddressNewTransactionQueuePoller', () => {
  const depositAddressTransactionQueuePoller = new DepositAddressNewTransactionQueuePoller()
  const address = 'addressFoo'
  const transactionId = 'txId'
  const testDepositTransactionQueue = 'local-deposit-transaction-queue'
  let recordDepositTransactionStub
  let getTransactionStub

  const depositRequest = {
    id: 1,
  } as any
  const depositAddress = {
    id: 1,
  } as any
  let onChainCurrencyManagerStub

  const transactionDetails = {
    transactionHash: 'txHash',
    receiverAddress: 'receiver-address-1',
    senderAddress: 'sender-address-2',
    amount: 3,
    time: new Date(),
  }

  beforeEach(() => {
    sinon.restore()

    getTransactionStub = sinon.stub()
    onChainCurrencyManagerStub = {
      getCurrencyFromTicker: () => ({
        getTransaction: getTransactionStub,
      }),
    } as any
    recordDepositTransactionStub = sinon.stub(NewTransactionRecorder.prototype, 'recordDepositTransaction').resolves(depositRequest)
    process.env.DEPOSIT_CONFIRMED_TRANSACTION_CALLBACK_URL = testDepositTransactionQueue
  })

  afterEach(() => sinon.restore())

  it('processDepositAddressTransaction should check if the transaction is for an ERC20 token', async () => {
    stubAllDependencies()

    await depositAddressTransactionQueuePoller['processNewDepositAddressTransaction']({
      token_symbol: CurrencyCode.tether,
      address,
      txHash: transactionId,
    } as any)

    expect(recordDepositTransactionStub.calledWith({ currency: CurrencyCode.tether, depositAddress, depositTransactionDetails: transactionDetails }))
    expect(getTransactionStub.calledWith(transactionId, address)).to.eql(true)
  })

  describe('processDepositAddressTransaction', () => {
    it('should not process transaction when deposit address not found', async () => {
      sinon.stub(coreOperations, 'findDepositAddress').resolves(null)

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction'](CurrencyCode.bitcoin, address, transactionId)

      expect(getTransactionStub.calledOnce).to.eql(false)
    })

    it('should process transaction when deposit address found', async () => {
      stubAllDependencies()

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction'](CurrencyCode.bitcoin, address, transactionId)

      expect(
        recordDepositTransactionStub.calledWith({ currency: CurrencyCode.bitcoin, depositAddress, depositTransactionDetails: transactionDetails }),
      )
    })
  })

  function stubAllDependencies() {
    sinon.stub(blockchainCurrencyGateway, 'getOnChainCurrencyManagerForEnvironment').returns(onChainCurrencyManagerStub)
    sinon.stub(coreOperations, 'findDepositAddress').resolves(depositAddress)
    getTransactionStub.resolves(transactionDetails)
  }
})
