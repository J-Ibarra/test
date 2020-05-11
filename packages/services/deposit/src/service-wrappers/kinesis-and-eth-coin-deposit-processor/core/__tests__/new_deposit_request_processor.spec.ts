import { expect } from 'chai'
import * as sinon from 'sinon'
import * as Account from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequestStatus } from '@abx-types/deposit'
import * as privateKeyOperations from '@abx-utils/encryption'
import * as depositRequestOperations from '../../../../core'
import * as FailedHoldingsTransactionChecker from '../kvt-eth/failed_transactions_operations/failed_holdings_transaction_checker'
import { processNewestDepositRequestForCurrency } from '../kvt-eth/new_deposit_processor/new_deposit_request_processor'
import { currencyToDepositRequests, decryptedPrivateKey, depositAddress, depositRequest } from './data.helper'
import { DepositGatekeeper } from '../common'
import * as balanceOperations from '@abx-service-clients/balance'
import * as blockchainOperations from '@abx-utils/blockchain-currency-gateway'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

const depositTxHash = 'deposit-tx-hash'
const holdingsTxFee = '0.5'

describe('new_deposit_request_processor', () => {
  let pendingHoldingsTransferGatekeeper: DepositGatekeeper
  let pendingCompletionGatekeeper: DepositGatekeeper
  let pendingSuspendedDepositGatekeeper: DepositGatekeeper
  const transactionFeeCap = 12
  const transactionFeeIncrement = 11

  beforeEach(async () => {
    pendingHoldingsTransferGatekeeper = new DepositGatekeeper('pendingHoldingsTransferGatekeeper')
    pendingCompletionGatekeeper = new DepositGatekeeper('pendingCompletionGatekeeper')
    pendingSuspendedDepositGatekeeper = new DepositGatekeeper('pendingSuspendedDepositGatekeeper')

    sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
      transactionFeeCap,
      transactionFeeIncrement,
    })
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should not execute any logic when no new requests in pendingHoldingsTransferGatekeeper', async () => {
    const checkConfirmationOfTransactionSpy = sinon.spy()

    const currencyGateway = {
      getCurrencyFromTicker: () => ({
        checkConfirmationOfTransaction: checkConfirmationOfTransactionSpy,
      }),
    }

    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
    )

    expect(checkConfirmationOfTransactionSpy.getCalls().length).to.eql(0)
  })

  it('should not transfer amount if deposit transaction no confirmed', async () => {
    pendingHoldingsTransferGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const checkConfirmationOfTransactionSpy = sinon.mock().resolves(false)

    const currencyGateway = {
      getCurrencyFromTicker: () => ({
        checkConfirmationOfTransaction: checkConfirmationOfTransactionSpy,
      }),
    }

    const pendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit')
    sinon.stub(Account, 'isAccountSuspended').resolves(false)
    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
    )

    expect(checkConfirmationOfTransactionSpy.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)![0].isLocked).to.eql(false)
    expect(pendingDepositStub.getCalls().length).to.eql(0)
  })

  it('should transfer deposit amount to holdings if deposit transaction confirmed and add request to pendingCompletionGatekeeper', async () => {
    const { currencyGateway, pendingDepositStub, updateAllDepositRequestsStub, transferToExchangeHoldingsFromMock } = prepareStubs(
      CurrencyCode.kau,
      pendingHoldingsTransferGatekeeper,
      sinon.mock().resolves({ txHash: depositTxHash, transactionFee: holdingsTxFee }),
    )
    sinon.stub(Account, 'isAccountSuspended').resolves(false)

    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
    )

    expect(
      pendingDepositStub.calledWith({
        accountId: depositAddress.accountId,
        amount: depositRequest.amount,
        currencyId: depositRequest.depositAddress.currencyId,
        sourceEventId: depositRequest.id!,
        sourceEventType: SourceEventType.currencyDepositRequest,
      }),
    ).to.eql(true)

    expect(updateAllDepositRequestsStub.getCall(0).args[0]).to.eql([depositRequest.id])
    expect(updateAllDepositRequestsStub.getCall(0).args[1]).to.eql({
      holdingsTxHash: depositTxHash,
      holdingsTxFee: Number(holdingsTxFee),
      status: DepositRequestStatus.pendingCompletion,
    })

    expect(
      transferToExchangeHoldingsFromMock.calledWith(
        {
          privateKey: decryptedPrivateKey,
          publicKey: depositAddress.publicKey,
          address: undefined,
          wif: undefined,
        },
        depositRequest.amount,
        transactionFeeCap,
        transactionFeeIncrement,
      ),
    ).to.eql(true)
    expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)!.length).to.eql(0)
  })

  it('should update status to failedHoldingsTransaction if holdings transfer fails and add request to FailedHoldingsTransactionChecker', async () => {
    const { currencyGateway, updateDepositStub, transferToExchangeHoldingsFromMock } = prepareStubs(
      CurrencyCode.kau,
      pendingHoldingsTransferGatekeeper,
      sinon.mock().rejects('Transfer failure'),
    )
    const registerFailedRequestStub = sinon.stub(FailedHoldingsTransactionChecker, 'registerFailedRequest')
    sinon.stub(Account, 'isAccountSuspended').resolves(false)
    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
    )

    expect(
      updateDepositStub.calledWith(depositRequest.id!, {
        status: DepositRequestStatus.failedHoldingsTransaction,
      }),
    ).to.eql(true)
    expect(
      transferToExchangeHoldingsFromMock.calledWith(
        {
          privateKey: decryptedPrivateKey,
          publicKey: depositAddress.publicKey,
          address: undefined,
          wif: undefined,
        },
        depositRequest.amount,
        transactionFeeCap,
        transactionFeeIncrement,
      ),
    ).to.eql(true)
    expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)!.length).to.eql(0)
    expect(registerFailedRequestStub.calledOnceWith(CurrencyCode.kau, depositRequest)).to.eql(true)
  }).timeout(60_000)

  it('should create a pendingWithdrawal balance if the deposit currency needs to be covered', async () => {
    const {
      currencyGateway,
      pendingDepositStub,
      pendingWithdrawalStub,
      updateAllDepositRequestsStub,
      transferToExchangeHoldingsFromMock,
    } = prepareStubs(
      CurrencyCode.ethereum,
      pendingHoldingsTransferGatekeeper,
      sinon.mock().resolves({ txHash: depositTxHash, transactionFee: holdingsTxFee }),
    )

    sinon.stub(Account, 'isAccountSuspended').resolves(false)
    sinon.stub(referenceDataOperations, 'getCurrencyId').resolves(1)
    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.ethereum,
      currencyGateway as any,
    )

    expect(
      pendingDepositStub.calledWith({
        accountId: depositAddress.accountId,
        amount: depositRequest.amount,
        currencyId: depositRequest.depositAddress.currencyId,
        sourceEventId: depositRequest.id!,
        sourceEventType: SourceEventType.currencyDepositRequest,
      }),
    ).to.eql(true)

    expect(updateAllDepositRequestsStub.getCall(0).args[0]).to.eql([depositRequest.id])
    expect(updateAllDepositRequestsStub.getCall(0).args[1]).to.eql({
      holdingsTxHash: depositTxHash,
      holdingsTxFee: Number(holdingsTxFee),
      status: DepositRequestStatus.pendingCompletion,
    })
    expect(
      transferToExchangeHoldingsFromMock.calledWith(
        {
          privateKey: decryptedPrivateKey,
          publicKey: depositAddress.publicKey,
          address: undefined,
          wif: undefined,
        },
        depositRequest.amount,
        transactionFeeCap,
        transactionFeeIncrement,
      ),
    ).to.eql(true)
    expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.ethereum)!.length).to.eql(0)
    expect(pendingWithdrawalStub.getCalls().length).to.eql(1)
  })
})

const prepareStubs = (
  currencyToStub: CurrencyCode,
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
  transferToExchangeHoldingsFromMock,
  balance = 10,
) => {
  pendingHoldingsTransferGatekeeper.addNewDepositsForCurrency(currencyToStub, [depositRequest])

  const currencyGateway = {
    getCurrencyFromTicker: sinon.stub().returns({
      checkConfirmationOfTransaction: sinon.mock().resolves(true),
      transferToExchangeHoldingsFrom: transferToExchangeHoldingsFromMock,
      balanceAt: () => Promise.resolve(balance),
      ticker: currencyToStub,
    }),
    transferToExchangeHoldingsFrom: transferToExchangeHoldingsFromMock,
  } as any
  const onChainCurrencyManagerStub = {
    getCurrencyFromTicker: sinon.stub().returns(currencyGateway),
    transferToExchangeHoldingsFrom: transferToExchangeHoldingsFromMock,
  } as any

  sinon.stub(blockchainOperations, 'getOnChainCurrencyManagerForEnvironment').returns(onChainCurrencyManagerStub)

  sinon.stub(Account, 'findOrCreateKinesisRevenueAccount').resolves({ id: 'acc-1' })
  sinon.stub(privateKeyOperations, 'decryptValue').callsFake((key) => (key ? Promise.resolve(`decrypted ${key}`) : Promise.resolve(undefined)))
  const pendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit')
  const pendingWithdrawalStub = sinon.stub(balanceOperations, 'createPendingWithdrawal')
  const updateAllDepositRequestsStub = sinon.stub(depositRequestOperations, 'updateAllDepositRequests').resolves([depositRequest])
  const updateDepositStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves(depositRequest)

  return {
    currencyGateway,
    transferToExchangeHoldingsFromMock,
    pendingDepositStub,
    pendingWithdrawalStub,
    updateAllDepositRequestsStub,
    updateDepositStub,
  }
}
