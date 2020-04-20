import { NewTransactionRecorder } from '../../deposit-transaction-recording/NewTransactionRecorder'
import { CurrencyCode } from '@abx-types/reference-data'
import * as coreOperations from '../../../../../core'
import sinon from 'sinon'
import { expect } from 'chai'
import * as marketDataOperations from '@abx-service-clients/market-data'
import { DepositRequestStatus } from '@abx-types/deposit'
import * as asyncMessagePublisherOperations from '@abx-utils/async-message-publisher'
import * as blockchainGateway from '@abx-utils/blockchain-currency-gateway'

describe('NewTransactionRecorder:recordDepositTransaction', () => {
  const newTransactionRecorder = new NewTransactionRecorder()
  const depositTxHash = 'foo'
  let newTransactionDetails = {
    currency: CurrencyCode.bitcoin,
    depositTransactionDetails: {
      transactionHash: depositTxHash,
      amount: 5,
    },
    depositAddress: {
      id: 1,
    },
  } as any
  let subscribeToTransactionConfirmationEventsStub
  let onChainCurrencyManagerStub

  beforeEach(() => {
    subscribeToTransactionConfirmationEventsStub = sinon.stub()

    onChainCurrencyManagerStub = {
      getCurrencyFromTicker: () => ({
        subscribeToTransactionConfirmationEvents: subscribeToTransactionConfirmationEventsStub,
      }),
    } as any
  })

  afterEach(() => sinon.restore())

  it('should not record transaction when deposit request already exists with that hash', async () => {
    sinon.stub(coreOperations, 'findDepositRequestsWhereTransactionHashPresent').resolves([{ id: 1 }])
    const createNewDepositRequestStub = sinon.stub(coreOperations, 'createNewDepositRequest')
    await newTransactionRecorder.recordDepositTransaction(newTransactionDetails)

    expect(createNewDepositRequestStub.calledOnce).to.eql(false)
  })

  it('should record transaction with insufficientAmount status when amount < minAmount for currency', async () => {
    sinon.stub(coreOperations, 'findDepositRequestsWhereTransactionHashPresent').resolves([])
    sinon.stub(coreOperations, 'getMinimumDepositAmountForCurrency').resolves(200)

    const fiatValueForCryptoCurrency = 12
    sinon.stub(marketDataOperations, 'calculateRealTimeMidPriceForSymbol').resolves(fiatValueForCryptoCurrency)

    const sendAsyncChangeMessageStub = sinon.stub(asyncMessagePublisherOperations, 'sendAsyncChangeMessage').resolves()

    const createNewDepositRequestStub = sinon.stub(coreOperations, 'createNewDepositRequest').resolves()
    await newTransactionRecorder.recordDepositTransaction(newTransactionDetails)

    expect(
      createNewDepositRequestStub.calledWith(
        newTransactionDetails.depositTransactionDetails,
        newTransactionDetails.depositAddress,
        fiatValueForCryptoCurrency,
        DepositRequestStatus.insufficientAmount,
      ),
    ).to.eql(true)
    expect(sendAsyncChangeMessageStub.calledOnce).to.eql(false)
    expect(subscribeToTransactionConfirmationEventsStub.calledOnce).to.eql(false)
  })

  it('should record transaction when amount is big enough', async () => {
    sinon.stub(coreOperations, 'findDepositRequestsWhereTransactionHashPresent').resolves([])
    sinon.stub(blockchainGateway, 'getOnChainCurrencyManagerForEnvironment').returns(onChainCurrencyManagerStub)

    const fiatValueForCryptoCurrency = 12
    const confirmedTransactionCallbackUrl = 'foo'
    process.env.DEPOSIT_CONFIRMED_TRANSACTION_CALLBACK_URL = confirmedTransactionCallbackUrl
    sinon.stub(marketDataOperations, 'calculateRealTimeMidPriceForSymbol').resolves(fiatValueForCryptoCurrency)

    const createNewDepositRequestStub = sinon.stub(coreOperations, 'createNewDepositRequest').resolves()
    await newTransactionRecorder.recordDepositTransaction(newTransactionDetails)

    expect(
      createNewDepositRequestStub.calledWith(
        newTransactionDetails.depositTransactionDetails,
        newTransactionDetails.depositAddress,
        fiatValueForCryptoCurrency,
      ),
    ).to.eql(true)
  })
})
