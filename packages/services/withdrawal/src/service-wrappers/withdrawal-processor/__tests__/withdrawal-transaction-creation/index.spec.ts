import sinon from 'sinon'
import { expect } from 'chai'
import { processNewWithdrawalRequest } from '../../core/withdrawal-transaction-creation'
import { BatchCryptoWithdrawalRequestWrapper, SingleCryptoWithdrawalRequestWrapper } from '@abx-service-clients/withdrawal'
import { CurrencyCode } from '@abx-types/reference-data'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as batchWithdrawalProcessorOperations from '../../core/withdrawal-transaction-creation/batch-processing/batch_withdrawal_processor'
import * as cryptoCurrencyRequestHandlerOperations from '../../core/withdrawal-transaction-creation/crypto_currency_request_handler'

import * as blockchainOperations from '@abx-utils/blockchain-currency-gateway'
import * as coreOperations from '../../../../core'

describe('processNewWithdrawalRequest', () => {
  const BTC = {
    id: 1,
    code: CurrencyCode.bitcoin,
  } as any
  const ETH = {
    id: 2,
    code: CurrencyCode.ethereum,
  } as any
  const onChainCurrencyGateway = {} as any

  beforeEach(() => {
    const currencyManager = {
      getCurrencyFromTicker: () => onChainCurrencyGateway,
    }
    sinon.stub(blockchainOperations, 'getOnChainCurrencyManagerForEnvironment').returns(currencyManager)
  })

  afterEach(() => sinon.restore())

  it('should call processWaitingWithdrawalBatch if request is batch', async () => {
    const cryptoWithdrawalRequest: BatchCryptoWithdrawalRequestWrapper = {
      isBatch: true,
      currency: CurrencyCode.bitcoin,
    }

    sinon.stub(referenceDataOperations, 'findCryptoCurrencies').resolves([BTC])
    const processWaitingWithdrawalBatchStub = sinon.stub(batchWithdrawalProcessorOperations, 'processWaitingWithdrawalBatch').resolves()

    await processNewWithdrawalRequest(cryptoWithdrawalRequest)

    expect(processWaitingWithdrawalBatchStub.calledWith(BTC.code, onChainCurrencyGateway)).to.eql(true)
  })

  it('should call handleCryptoCurrencyWithdrawalRequest if request is not batch', async () => {
    const withdrawalRequestId = 1
    const cryptoWithdrawalRequest: SingleCryptoWithdrawalRequestWrapper = {
      isBatch: false,
      id: withdrawalRequestId,
    }

    sinon.stub(coreOperations, 'findWithdrawalRequestByIdWithFeeRequest').resolves({
      id: withdrawalRequestId,
      currencyId: ETH.id,
    })
    sinon.stub(referenceDataOperations, 'findCryptoCurrencies').resolves([ETH])
    const handleCryptoCurrencyWithdrawalRequestStub = sinon
      .stub(cryptoCurrencyRequestHandlerOperations, 'handleCryptoCurrencyWithdrawalRequest')
      .resolves()
    await processNewWithdrawalRequest(cryptoWithdrawalRequest)

    expect(
      handleCryptoCurrencyWithdrawalRequestStub.calledWith({ id: withdrawalRequestId, currencyId: ETH.id, currency: ETH }, onChainCurrencyGateway),
    ).to.eql(true)
  })
})
