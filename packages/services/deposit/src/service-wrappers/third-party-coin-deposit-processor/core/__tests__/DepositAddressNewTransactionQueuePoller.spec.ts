import sinon from 'sinon'
import { expect } from 'chai'
import * as coreOperations from '../../../../core'
import * as blockchainCurrencyGateway from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import * as marketDataClient from '@abx-service-clients/market-data'
import { DepositAddressNewTransactionQueuePoller } from '../deposit-transaction-recording/DepositAddressNewTransactionQueuePoller'

describe('DepositAddressNewTransactionQueuePoller', () => {
  const depositAddressTransactionQueuePoller = new DepositAddressNewTransactionQueuePoller()
  const address = 'addressFoo'
  const transactionId = 'txId'
  const testDepositTransactionQueue = 'local-deposit-transaction-queue'
  const blockchainFacade = {
    getTransaction: sinon.stub(),
    subscribeToTransactionConfirmationEvents: sinon.stub().resolves(),
  } as any
  const transactionDetails = {
    transactionHash: 'txHash',
    receiverAddress: 'receiver-address-1',
    senderAddress: 'sender-address-2',
    amount: 3,
    time: new Date(),
  }

  beforeEach(() => {
    sinon.restore()
    process.env.DEPOSIT_CONFIRMED_TRANSACTION_CALLBACK_URL = testDepositTransactionQueue
  })

  afterEach(() => sinon.restore())

  describe('processDepositAddressTransaction', () => {
    it('should not process transaction when deposit address not found', async () => {
      sinon.stub(coreOperations, 'findDepositAddress').resolves(null)
      sinon.stub(blockchainCurrencyGateway.BlockchainFacade, 'getInstance').resolves(blockchainFacade)

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction']({
        currency: CurrencyCode.bitcoin,
        address,
        txid: transactionId,
      } as any)

      expect(blockchainFacade.getTransaction.calledOnce).to.eql(false)
    })

    it('should not process transaction when deposit request has already been persisted for that txid', async () => {
      const depositRequest = {
        id: 1,
      } as any
      sinon.stub(coreOperations, 'findDepositAddress').resolves(depositRequest)
      sinon.stub(blockchainCurrencyGateway.BlockchainFacade, 'getInstance').returns(blockchainFacade)

      blockchainFacade.getTransaction.resolves(transactionDetails)

      sinon.stub(coreOperations, 'findMostRecentlyUpdatedDepositRequest').resolves(depositRequest)
      const createNewDepositRequestStub = sinon.stub(coreOperations, 'createNewDepositRequest').resolves()

      blockchainFacade.getTransaction.resolves(transactionDetails)

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction']({
        currency: CurrencyCode.bitcoin,
        address,
        txid: transactionId,
      } as any)

      expect(createNewDepositRequestStub.calledOnce).to.eql(false)
    })

    it('should process transaction when deposit address found', async () => {
      const depositAddress = {
        id: 1,
      }
      const depositRequest = {
        id: 1,
      } as any
      const fiatValueFor1Currency = 1

      sinon.stub(coreOperations, 'findDepositAddress').resolves(depositAddress)
      sinon.stub(coreOperations, 'findMostRecentlyUpdatedDepositRequest').resolves()
      sinon.stub(blockchainCurrencyGateway.BlockchainFacade, 'getInstance').returns(blockchainFacade)

      blockchainFacade.getTransaction.resolves(transactionDetails)
      const calculateRealTimeMidPriceForSymbolStub = sinon
        .stub(marketDataClient, 'calculateRealTimeMidPriceForSymbol')
        .resolves(fiatValueFor1Currency)
      const createNewDepositRequestStub = sinon.stub(coreOperations, 'createNewDepositRequest').resolves(depositRequest)

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction']({
        currency: CurrencyCode.bitcoin,
        address,
        txid: transactionId,
      } as any)

      expect(calculateRealTimeMidPriceForSymbolStub.calledWith('BTC_USD')).to.eql(true)
      expect(createNewDepositRequestStub.calledWith(transactionDetails, depositRequest, fiatValueFor1Currency)).to.eql(true)

      expect(blockchainFacade.subscribeToTransactionConfirmationEvents.calledWith(transactionId, testDepositTransactionQueue)).to.eql(true)
    })
  })
})
