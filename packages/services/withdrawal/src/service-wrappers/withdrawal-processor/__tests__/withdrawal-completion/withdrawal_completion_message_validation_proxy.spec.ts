import sinon from 'sinon'
import { expect } from 'chai'
import { processWithdrawalCompletionRequest } from '../../core/withdrawal-completion/withdrawal_completion_message_validation_proxy'
import { CurrencyCode } from '@abx-types/reference-data'
import * as coreOperations from '../../../../core'
import * as completeWithdrawalRequestOperations from '../../core/withdrawal-completion/withdrawal_request_completer'
import * as blockchainOperations from '@abx-utils/blockchain-currency-gateway'

describe('withdrawal_completion_message_validation_proxy', () => {
  const payload = {
    txid: '1',
    currency: CurrencyCode.ethereum,
  }
  let getTransactionStub
  let currencyМаnager

  beforeEach(() => {
    sinon.restore()
    getTransactionStub = sinon.stub()
    currencyМаnager = {
      getCurrencyFromTicker: () => ({
        getTransaction: getTransactionStub,
      }),
    }
    sinon.stub(blockchainOperations, 'getOnChainCurrencyManagerForEnvironment').returns(currencyМаnager)
  })

  afterEach(() => sinon.restore())

  it('should trigger withdrawal completion flow if message not an address transaction notification', async () => {
    const findWithdrawalRequestStub = sinon.stub(coreOperations, 'findWithdrawalRequest').resolves()
    const completeWithdrawalRequestStub = sinon.stub(completeWithdrawalRequestOperations, 'completeWithdrawalRequest')

    await processWithdrawalCompletionRequest({
      txid: '1',
      currency: CurrencyCode.ethereum,
    })

    expect(findWithdrawalRequestStub.calledOnce).to.eql(false)
    expect(completeWithdrawalRequestStub.calledWith(payload)).to.eql(true)
  })

  it('should not trigger withdrawal request when transaction incoming', async () => {
    const address = 'addr-1'
    const txid = '1'

    getTransactionStub.resolves({ senderAddress: 'addr-2' })

    const findWithdrawalRequestStub = sinon.stub(coreOperations, 'findWithdrawalRequest').resolves({})
    const completeWithdrawalRequestStub = sinon.stub(completeWithdrawalRequestOperations, 'completeWithdrawalRequest')

    await processWithdrawalCompletionRequest({
      txid,
      currency: CurrencyCode.bitcoin,
      address,
    })

    expect(findWithdrawalRequestStub.calledWith({ txHash: txid })).to.eql(true)
    expect(completeWithdrawalRequestStub.calledOnce).to.eql(false)
  })

  it('should not trigger withdrawal request when withdrawal request not found', async () => {
    const address = 'addr-1'
    const txid = '1'

    getTransactionStub.resolves({ senderAddress: address })

    const findWithdrawalRequestStub = sinon.stub(coreOperations, 'findWithdrawalRequest').resolves()
    const completeWithdrawalRequestStub = sinon.stub(completeWithdrawalRequestOperations, 'completeWithdrawalRequest')

    await processWithdrawalCompletionRequest({
      txid,
      currency: CurrencyCode.bitcoin,
      address,
      confirmations: 1,
    })

    expect(findWithdrawalRequestStub.calledWith({ txHash: txid })).to.eql(true)
    expect(completeWithdrawalRequestStub.calledOnce).to.eql(false)
  })

  it('should not trigger withdrawal request when not enough confirmations reached', async () => {
    const address = 'addr-1'
    const txid = '1'

    getTransactionStub.resolves({ senderAddress: address })

    const findWithdrawalRequestStub = sinon.stub(coreOperations, 'findWithdrawalRequest').resolves({})
    const completeWithdrawalRequestStub = sinon.stub(completeWithdrawalRequestOperations, 'completeWithdrawalRequest')

    await processWithdrawalCompletionRequest({
      txid,
      currency: CurrencyCode.bitcoin,
      address,
      confirmations: 0,
    })

    expect(findWithdrawalRequestStub.calledWith({ txHash: txid })).to.eql(true)
    expect(completeWithdrawalRequestStub.calledWith({ txid, currency: CurrencyCode.bitcoin })).to.eql(false)
  })

  it('should trigger withdrawal request when all requirements satisfied', async () => {
    const address = 'addr-1'
    const txid = '1'

    getTransactionStub.resolves({ senderAddress: address })

    const findWithdrawalRequestStub = sinon.stub(coreOperations, 'findWithdrawalRequest').resolves({})
    const completeWithdrawalRequestStub = sinon.stub(completeWithdrawalRequestOperations, 'completeWithdrawalRequest')

    await processWithdrawalCompletionRequest({
      txid,
      currency: CurrencyCode.bitcoin,
      address,
      confirmations: 1,
    })

    expect(findWithdrawalRequestStub.calledWith({ txHash: txid })).to.eql(true)
    expect(completeWithdrawalRequestStub.calledWith({ txid, currency: CurrencyCode.bitcoin })).to.eql(true)
  })
})
