import { NewTransactionRecorder } from '../../deposit-transaction-recording/NewTransactionRecorder'
import { CurrencyCode } from '@abx-types/reference-data'
import * as coreOperations from '../../../../../core'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import sinon from 'sinon'
import { expect } from 'chai'
import * as marketDataOperations from '@abx-service-clients/market-data'
import { DepositRequestStatus } from '@abx-types/deposit'

describe('NewTransactionRecorder:recordDepositTransaction', () => {
  const newTransactionRecorder = new NewTransactionRecorder()
  const depositTxHash = 'foo'
  let newTransactionDetails

  beforeEach(() => {
    newTransactionDetails = {
      currency: CurrencyCode.bitcoin,
      depositTransactionDetails: {
        transactionHash: depositTxHash,
        amount: 5,
      },
      depositAddress: {
        id: 1,
      },
    } as any

    sinon.stub(referenceDataOperations, 'getDepositMimimumAmountForCurrency').resolves(10)
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

    const fiatValueForCryptoCurrency = 12
    sinon.stub(marketDataOperations, 'calculateRealTimeMidPriceForSymbol').resolves(fiatValueForCryptoCurrency)
    const createNewDepositRequestStub = sinon.stub(coreOperations, 'createNewDepositRequest').resolves()
    await newTransactionRecorder.recordDepositTransaction(newTransactionDetails)

    expect(
      createNewDepositRequestStub.calledWith(
        newTransactionDetails.depositTransactionDetails,
        newTransactionDetails.depositAddress,
        fiatValueForCryptoCurrency * newTransactionDetails.depositTransactionDetails.amount,
        DepositRequestStatus.insufficientAmount,
      ),
    ).to.eql(true)
  })

  it('should record transaction when amount is big enough', async () => {
    sinon.stub(coreOperations, 'findDepositRequestsWhereTransactionHashPresent').resolves([])

    const fiatValueForCryptoCurrency = 12
    const confirmedTransactionCallbackUrl = 'foo'
    process.env.DEPOSIT_CONFIRMED_TRANSACTION_CALLBACK_URL = confirmedTransactionCallbackUrl
    sinon.stub(marketDataOperations, 'calculateRealTimeMidPriceForSymbol').resolves(fiatValueForCryptoCurrency)

    const createNewDepositRequestStub = sinon.stub(coreOperations, 'createNewDepositRequest').resolves()
    
    newTransactionDetails.depositTransactionDetails.amount = 14
    await newTransactionRecorder.recordDepositTransaction(newTransactionDetails)

    expect(
      createNewDepositRequestStub.calledWith(
        newTransactionDetails.depositTransactionDetails,
        newTransactionDetails.depositAddress,
        fiatValueForCryptoCurrency * newTransactionDetails.depositTransactionDetails.amount,
      ),
    ).to.eql(true)
    expect(createNewDepositRequestStub.args[0].length).to.eql(3)
  })
})
