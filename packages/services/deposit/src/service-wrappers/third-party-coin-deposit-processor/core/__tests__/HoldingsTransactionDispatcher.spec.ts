import sinon from 'sinon'
import { expect } from 'chai'
import { HoldingsTransactionDispatcher } from '../holdings-transaction-creation/HoldingsTransactionDispatcher'
import { CurrencyCode } from '@abx-types/reference-data'
import * as accountClientOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import * as blockchainCurrencyGateway from '@abx-utils/blockchain-currency-gateway'
import { SourceEventType } from '@abx-types/balance'
import * as depositRequestOperations from '../../../../core'
import { DepositRequestStatus } from '@abx-types/deposit'

describe('HoldingsTransactionDispatcher', () => {
  const holdingsTransactionDispatcher = new HoldingsTransactionDispatcher()
  const currency = CurrencyCode.bitcoin
  const transactionHash = 'txHash'
  const depositRequest = {
    id: 1,
    amount: 5,
    depositAddress: {
      id: 1,
      accountId: 'accc-id-1',
      currencyId: 2,
      encryptedPrivateKey: '10',
      encryptedWif: '12',
      address: 'addr',
    },
  } as any
  const bitcoinHoldingsAddress = 'btc-holdings'
  const depositConfirmationCallbackUrl = 'callback-url'

  beforeEach(() => {
    process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS = bitcoinHoldingsAddress
    process.env.DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_CALLBACK_URL = depositConfirmationCallbackUrl
  })

  afterEach(() => sinon.restore())

  describe('transferTransactionAmountToHoldingsWallet', () => {
    it('should not create holdings transaction', async () => {
      sinon.stub(accountClientOperations, 'isAccountSuspended').resolves(true)
      const createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()

      await holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(currency, transactionHash, depositRequest)

      expect(createPendingDepositStub.calledOnce).to.eql(false)
    })

    it('should create holdings transaction when account not suspended', async () => {
      sinon.stub(accountClientOperations, 'isAccountSuspended').resolves(false)
      const createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()
      const createTransactionStub = sinon.stub()
      sinon.stub(blockchainCurrencyGateway.BlockchainFacade, 'getInstance').returns({
        createTransaction: createTransactionStub,
      } as any)
      const depositRequestOperationsStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves()

      await holdingsTransactionDispatcher.transferTransactionAmountToHoldingsWallet(currency, transactionHash, depositRequest)

      expect(
        createPendingDepositStub.calledWith({
          accountId: depositRequest.depositAddress.accountId,
          amount: depositRequest.amount,
          currencyId: depositRequest.depositAddress.currencyId,
          sourceEventId: depositRequest.id!,
          sourceEventType: SourceEventType.currencyDepositRequest,
        }),
      ).to.eql(true)

      expect(
        createTransactionStub.calledWith({
          senderAddress: {
            privateKey: depositRequest.depositAddress.encryptedPrivateKey!,
            wif: depositRequest.depositAddress.encryptedWif!,
            address: depositRequest.depositAddress.address!,
          },
          receiverAddress: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
          amount: depositRequest.amount,
          webhookCallbackUrl: process.env.DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_CALLBACK_URL!,
        }),
      ).to.eql(true)

      expect(
        depositRequestOperationsStub.calledWith(depositRequest.id, {
          holdingsTxHash: transactionHash,
          status: DepositRequestStatus.pendingCompletion,
          holdingsTxFee: Number(),
        }),
      )
    })
  })
})
