import sinon from 'sinon'
import { expect } from 'chai'
import * as coreOperations from '../../../../core'
import * as blockchainCurrencyGateway from '@abx-utils/blockchain-currency-gateway'

import { CurrencyCode } from '@abx-types/reference-data'
import { DepositAddressNewTransactionQueuePoller } from '../deposit-transaction-recording/DepositAddressNewTransactionQueuePoller'
import { NewTransactionRecorder } from '../../core/deposit-transaction-recording/NewTransactionRecorder'
import { HoldingsTransactionDispatcher } from '../holdings-transaction-creation/HoldingsTransactionDispatcher'

describe('DepositAddressNewTransactionQueuePoller', () => {
  const depositAddressTransactionQueuePoller = new DepositAddressNewTransactionQueuePoller()
  const address = 'addressFoo'
  const transactionId = 'txId'
  const testDepositTransactionQueue = 'local-deposit-transaction-queue'
  let recordDepositTransactionStub
  let getTransactionStub
  let processHoldingsTransactionStub

  const depositRequest = {
    id: 1,
  } as any
  const depositAddress = {
    id: 1,
  } as any
  let onChainCurrencyManagerStub

  const transactionDetails = {
    transactionHash: 'txHash',
    receiverAddress: address,
    senderAddress: 'sender-address-2',
    amount: 3,
    time: new Date(),
  }

  const confirmedTransactionDetails = {
    ...transactionDetails,
    confirmations: 1
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
    processHoldingsTransactionStub = sinon.stub(HoldingsTransactionDispatcher.prototype, 'processDepositAddressTransaction').resolves()
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

    it('should not process transaction when the receiver is not the current address', async () => {
      stubAllDependencies()

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction'](CurrencyCode.bitcoin, 'test', transactionId)

      expect(getTransactionStub.calledOnce).to.eql(true)
      expect(recordDepositTransactionStub.calledOnce).to.eql(false)
    })

    it('should process transaction when deposit address found', async () => {
      stubAllDependencies()

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction'](CurrencyCode.bitcoin, address, transactionId)

      expect(
        recordDepositTransactionStub.calledWith({ currency: CurrencyCode.bitcoin, depositAddress, depositTransactionDetails: transactionDetails }),
      )
    })

    it('should not process holdings transaction when deposit amount is low', async () => {
      stubAllDependencies()
      getTransactionStub.resolves({...confirmedTransactionDetails, amount: 0.00001})
      const bitcoinConfirmationsRequired = 1
      process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS = `${bitcoinConfirmationsRequired}`

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction'](CurrencyCode.bitcoin, address, transactionId)

      expect(getTransactionStub.calledOnce).to.eql(true)
      expect(recordDepositTransactionStub.calledOnce).to.eql(true)
      expect(processHoldingsTransactionStub.calledOnce).to.eql(false)
    })

    it('should process holdings transaction when deposit amount is big enough', async () => {
      stubAllDependencies()
      getTransactionStub.resolves(confirmedTransactionDetails)
      const bitcoinConfirmationsRequired = 1
      process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS = `${bitcoinConfirmationsRequired}`

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction'](CurrencyCode.bitcoin, address, transactionId)

      expect(getTransactionStub.calledOnce).to.eql(true)
      expect(recordDepositTransactionStub.calledOnce).to.eql(true)
      expect(processHoldingsTransactionStub.calledOnce).to.eql(true)
    })
  })

  function stubAllDependencies() {
    sinon.stub(blockchainCurrencyGateway, 'getOnChainCurrencyManagerForEnvironment').returns(onChainCurrencyManagerStub)
    sinon.stub(coreOperations, 'findDepositAddressByAddressOrPublicKey').resolves(depositAddress)
    getTransactionStub.resolves(transactionDetails)
  }
})
