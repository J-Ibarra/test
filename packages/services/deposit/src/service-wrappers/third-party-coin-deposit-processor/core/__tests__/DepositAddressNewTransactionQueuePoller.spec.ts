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

  const blockchainFacade = {
    getTransaction: sinon.stub(),
    subscribeToTransactionConfirmationEvents: sinon.stub().resolves(),
  } as any

  beforeEach(() => {
    sinon.restore()
  })

  afterEach(() => sinon.restore())

  describe('processDepositAddressTransaction', () => {
    it('should not process transaction when deposit address not found', async () => {
      sinon.stub(coreOperations, 'findDepositAddress').resolves(null)
      const getInstance = sinon.stub(blockchainCurrencyGateway.BlockchainFacade, 'getInstance').resolves(null)

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction']({
        currency: CurrencyCode.bitcoin,
        address,
        txid: transactionId,
      } as any)

      expect(getInstance.calledOnce).to.eql(false)
    })

    it('should process transaction when deposit address not found', async () => {
      const depositAddress = {
        id: 1,
      }
      const transactionDetails = {
        transactionHash: 'txHash',
        receiverAddress: 'receiver-address-1',
        senderAddress: 'sender-address-2',
        amount: 3,
        time: new Date(),
      }
      const depositRequest = {
        id: 1,
      } as any
      const fiatValueFor1Currency = 1

      sinon.stub(coreOperations, 'findDepositAddress').resolves(depositAddress)

      sinon.stub(blockchainCurrencyGateway.BlockchainFacade, 'getInstance').returns(blockchainFacade)

      const getInstance = blockchainFacade.getTransaction.resolves(transactionDetails)
      const calculateRealTimeMidPriceForSymbolStub = sinon
        .stub(marketDataClient, 'calculateRealTimeMidPriceForSymbol')
        .resolves(fiatValueFor1Currency)
      const createNewDepositRequestStub = sinon.stub(coreOperations, 'createNewDepositRequest').resolves(depositRequest)

      await depositAddressTransactionQueuePoller['processDepositAddressTransaction']({
        currency: CurrencyCode.bitcoin,
        address,
        txid: transactionId,
      } as any)

      expect(getInstance.calledOnce).to.eql(true)
      expect(calculateRealTimeMidPriceForSymbolStub.calledWith('BTC_USD')).to.eql(true)
      expect(createNewDepositRequestStub.calledWith(transactionDetails, depositRequest, fiatValueFor1Currency)).to.eql(true)

      expect(blockchainFacade.subscribeToTransactionConfirmationEvents.calledWith(transactionId, 'local-deposit-transaction-queue')).to.eql(true)
    })
  })
})
