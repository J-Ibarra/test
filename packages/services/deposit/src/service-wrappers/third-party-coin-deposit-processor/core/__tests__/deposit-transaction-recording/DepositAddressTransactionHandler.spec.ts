import sinon from 'sinon'
import { expect } from 'chai'

import * as blockchainGateway from '@abx-utils/blockchain-currency-gateway'
import { DepositAddressTransactionHandler } from '../../deposit-transaction-recording/DepositAddressTransactionHandler'
import { NewTransactionRecorder } from '../../deposit-transaction-recording/NewTransactionRecorder'
import { CurrencyCode } from '@abx-types/reference-data'
import { HoldingsTransactionGateway } from '../../holdings-transaction-creation/HoldingsTransactionGateway'
import * as utilOperations from '../../utils'
import { HoldingsTransactionConfirmationHandler } from '../../deposit-transaction-recording/HoldingsTransactionConfirmationHandler'
import * as coreOperations from '../../../../../core'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

describe('DepositAddressTransactionHandler', () => {
  const getTransactionStub = sinon.stub()
  const txid = 'txid-1'
  const holdingsAddress = 'holdings address'
  const depositAddress = {
    id: 1,
    address: 'deposit-address',
  } as any
  const depositAddressTransactionHandler = new DepositAddressTransactionHandler()
  
  beforeEach(() => {
    process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS = holdingsAddress

    const onChainCurrencyManagerStub = {
      getCurrencyFromTicker: () => ({
        getTransaction: getTransactionStub,
        getHoldingPublicAddress: () => Promise.resolve(holdingsAddress),
      }),
    } as any

    sinon.stub(blockchainGateway, 'getOnChainCurrencyManagerForEnvironment').returns(onChainCurrencyManagerStub)
    sinon.stub(utilOperations, 'getRequiredConfirmationsForDepositTransaction').returns(1)
    sinon.stub(referenceDataOperations, 'getDepositMimimumAmountForCurrency').resolves(0.0002)
  })

  afterEach(() => sinon.restore())

  describe('incoming transaction', () => {
    it('should record deposit transaction but not process it when confirmations is 0', async () => {
      const depositTransactionDetails = {
        receiverAddress: depositAddress.address,
      } as any

      getTransactionStub.resolves(depositTransactionDetails)

      const recordDepositTransactionStub = sinon.stub(NewTransactionRecorder.prototype, 'recordDepositTransaction').resolves()
      const holdingsTransactionGatewayStub = sinon
        .stub(HoldingsTransactionGateway.prototype, 'dispatchHoldingsTransactionForConfirmedDepositRequest')
        .resolves()

      await depositAddressTransactionHandler.handleDepositAddressTransaction(txid, depositAddress, CurrencyCode.bitcoin)

      expect(
        recordDepositTransactionStub.calledWith({
          currency: CurrencyCode.bitcoin,
          depositAddress,
          depositTransactionDetails,
        }),
      ).to.eql(true)
      expect(holdingsTransactionGatewayStub.notCalled).to.eql(true)
    })

    it('should record deposit transaction but not process it when enough confirmations and amount below minimum', async () => {
      const depositTransactionDetails = {
        receiverAddress: depositAddress.address,
        confirmations: 1,
        amount: 0.0001,
      } as any

      getTransactionStub.resolves(depositTransactionDetails)

      const recordDepositTransactionStub = sinon.stub(NewTransactionRecorder.prototype, 'recordDepositTransaction').resolves()
      const holdingsTransactionGatewayStub = sinon
        .stub(HoldingsTransactionGateway.prototype, 'dispatchHoldingsTransactionForConfirmedDepositRequest')
        .resolves()

      await depositAddressTransactionHandler.handleDepositAddressTransaction(txid, depositAddress, CurrencyCode.bitcoin)

      expect(
        recordDepositTransactionStub.calledWith({
          currency: CurrencyCode.bitcoin,
          depositAddress,
          depositTransactionDetails,
        }),
      ).to.eql(true)
      expect(holdingsTransactionGatewayStub.notCalled).to.eql(true)
    })

    it('should record deposit transaction and process it when enough confirmations and amount above minimum', async () => {
      const depositTransactionDetails = {
        receiverAddress: depositAddress.address,
        confirmations: 1,
        amount: 1,
      } as any

      getTransactionStub.resolves(depositTransactionDetails)

      const recordDepositTransactionStub = sinon.stub(NewTransactionRecorder.prototype, 'recordDepositTransaction').resolves()
      const holdingsTransactionGatewayStub = sinon
        .stub(HoldingsTransactionGateway.prototype, 'dispatchHoldingsTransactionForConfirmedDepositRequest')
        .resolves()

      await depositAddressTransactionHandler.handleDepositAddressTransaction(txid, depositAddress, CurrencyCode.bitcoin)

      expect(
        recordDepositTransactionStub.calledWith({
          currency: CurrencyCode.bitcoin,
          depositAddress,
          depositTransactionDetails,
        }),
      ).to.eql(true)
      expect(holdingsTransactionGatewayStub.calledWith(txid, CurrencyCode.bitcoin)).to.eql(true)
    })
  })

  describe('outgoing', () => {
    it('should not trigger blocked deposit requests processing when confirmations not enough', async () => {
      const depositTransactionDetails = {
        receiverAddress: holdingsAddress,
        confirmations: 0,
        amount: 1,
      } as any
      const depositRequests = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ]
      getTransactionStub.resolves(depositTransactionDetails)
      sinon.stub(coreOperations, 'findAllDepositRequestsByTxHashes').resolves(depositRequests)
      const handleHoldingsTransactionConfirmationStub = sinon
        .stub(HoldingsTransactionConfirmationHandler.prototype, 'handleHoldingsTransactionConfirmation')
        .resolves()

      await depositAddressTransactionHandler.handleDepositAddressTransaction(txid, depositAddress, CurrencyCode.bitcoin)

      expect(handleHoldingsTransactionConfirmationStub.notCalled).to.eql(true)
    })

    it('should trigger blocked deposit requests processing when confirmations not enough', async () => {
      const depositTransactionDetails = {
        receiverAddress: holdingsAddress,
        confirmations: 1,
        amount: 1,
        transactionHash: txid,
      } as any
      const depositRequests = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ] as any

      getTransactionStub.resolves(depositTransactionDetails)
      sinon.stub(coreOperations, 'findAllDepositRequestsByTxHashes').resolves(depositRequests)
      const handleHoldingsTransactionConfirmationStub = sinon
        .stub(HoldingsTransactionConfirmationHandler.prototype, 'handleHoldingsTransactionConfirmation')
        .resolves()

      await depositAddressTransactionHandler.handleDepositAddressTransaction(txid, depositAddress, CurrencyCode.bitcoin)

      expect(handleHoldingsTransactionConfirmationStub.calledWith(txid, depositAddress.id, CurrencyCode.bitcoin)).to.eql(true)
    })
  })
})
