import { expect } from 'chai'
import * as sinon from 'sinon'
import * as Account from '../../../accounts'
import { BalanceMovementFacade, SourceEventType } from '../../../balances'
import { DepositGatekeeper } from '../../../deposits'
import { CurrencyCode } from '../../../symbols'
import { DepositRequestStatus } from '../../interfaces'
import * as privateKeyOperations from '../../lib/deposit_private_key'
import * as depositRequestOperations from '../../lib/deposit_request'
import * as FailedHoldingsTransactionChecker from '../framework/failed_transactions_operations/failed_holdings_transaction_checker'
import { processNewestDepositRequestForCurrency } from '../framework/new_deposit_processor/new_deposit_request_processor'
import { currencyToDepositRequests, decryptedPrivateKey, depositAddress, depositRequest } from './data.helper'

const depositTxHash = 'deposit-tx-hash'
const holdingsTxHash = 'holdings-tx-hash'
const holdingsTxFee = '0.5'

describe('new_deposit_request_processor', () => {
  let pendingHoldingsTransferGatekeeper: DepositGatekeeper
  let pendingCompletionGatekeeper: DepositGatekeeper
  let pendingSuspendedDepositGatekeeper: DepositGatekeeper

  beforeEach(async () => {
    pendingHoldingsTransferGatekeeper = new DepositGatekeeper('pendingHoldingsTransferGatekeeper')
    pendingCompletionGatekeeper = new DepositGatekeeper('pendingCompletionGatekeeper')
    pendingSuspendedDepositGatekeeper = new DepositGatekeeper('pendingSuspendedDepositGatekeeper')
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

    const pendingDepositStub = sinon.stub(BalanceMovementFacade.prototype, 'createPendingDeposit')
    sinon.stub(Account, 'hasAccountSuspended').resolves(false)
    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
    )

    expect(checkConfirmationOfTransactionSpy.calledOnceWith(depositRequest.depositTxHash)).to.eql(true)
    expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)[0].isLocked).to.eql(false)
    expect(pendingDepositStub.getCalls().length).to.eql(0)
  })

  it('should transfer deposit amount to holdings if deposit transaction confirmed and add request to pendingCompletionGatekeeper', async () => {
    const { currencyGateway, pendingDepositStub, updateStub, transferToExchangeHoldingsFromMock } = prepareStubs(
      CurrencyCode.kau,
      pendingHoldingsTransferGatekeeper,
      sinon.mock().resolves({ txHash: depositTxHash, transactionFee: holdingsTxFee }),
    )
    sinon.stub(Account, 'hasAccountSuspended').resolves(false)

    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
    )

    const transaction = pendingDepositStub.getCalls()[0].args[0].t
    expect(
      pendingDepositStub.calledWith({
        accountId: depositAddress.accountId,
        amount: depositRequest.amount,
        currencyId: depositRequest.depositAddress.currencyId,
        sourceEventId: depositRequest.id,
        sourceEventType: SourceEventType.currencyDepositRequest,
        t: transaction,
      }),
    ).to.eql(true)

    expect(
      updateStub.calledWith(
        depositRequest.id,
        {
          holdingsTxHash: depositTxHash,
          holdingsTxFee: Number(holdingsTxFee),
          status: DepositRequestStatus.pendingCompletion,
        },
        transaction,
      ),
    ).to.eql(true)
    expect(transferToExchangeHoldingsFromMock.calledWith(decryptedPrivateKey, depositRequest.amount)).to.eql(true)
    expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(0)
    expect(pendingCompletionGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)[0].request).to.eql(depositRequest)
  })

  it('should not transfer deposit amount to holdings if the balance at the address is 0 meaning a merge operation has been performed previously', async () => {
    const { currencyGateway, pendingDepositStub, updateStub, transferToExchangeHoldingsFromMock } = prepareStubs(
      CurrencyCode.kau,
      pendingHoldingsTransferGatekeeper,
      sinon.mock().resolves({ txHash: depositTxHash }),
      0,
    )
    sinon.stub(depositRequestOperations, 'findMostRecentlyUpdatedDepositRequest').resolves({ holdingsTxHash })

    sinon.stub(Account, 'hasAccountSuspended').resolves(false)

    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
    )

    const transaction = pendingDepositStub.getCalls()[0].args[0].t
    expect(
      pendingDepositStub.calledWith({
        accountId: depositAddress.accountId,
        amount: depositRequest.amount,
        currencyId: depositRequest.depositAddress.currencyId,
        sourceEventId: depositRequest.id,
        sourceEventType: SourceEventType.currencyDepositRequest,
        t: transaction,
      }),
    ).to.eql(true)

    // Holdings Fee is null here because there was no merge operation and thus does not return a fee
    expect(
      updateStub.calledWith(depositRequest.id, { holdingsTxHash, holdingsTxFee: 0, status: DepositRequestStatus.pendingCompletion }, transaction),
    ).to.eql(true)
    expect(transferToExchangeHoldingsFromMock.calledWith(decryptedPrivateKey, depositRequest.amount)).to.eql(false)
    expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(0)
    expect(pendingCompletionGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)[0].request).to.eql(depositRequest)
  })

  it('should update status to failedHoldingsTransaction if holdings transfer fails and add request to FailedHoldingsTransactionChecker', async () => {
    const { currencyGateway, updateStub, transferToExchangeHoldingsFromMock } = prepareStubs(
      CurrencyCode.kau,
      pendingHoldingsTransferGatekeeper,
      sinon.mock().rejects('Transfer failure'),
    )
    const registerFailedRequestStub = sinon.stub(FailedHoldingsTransactionChecker, 'registerFailedRequest')
    sinon.stub(Account, 'hasAccountSuspended').resolves(false)
    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
    )

    expect(
      updateStub.calledWith(depositRequest.id, {
        status: DepositRequestStatus.failedHoldingsTransaction,
      }),
    ).to.eql(true)
    expect(transferToExchangeHoldingsFromMock.calledWith(decryptedPrivateKey, depositRequest.amount)).to.eql(true)
    expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(0)
    expect(registerFailedRequestStub.calledOnceWith(CurrencyCode.kau, depositRequest)).to.eql(true)
  }).timeout(60_000)

  it('should not create a pendingWithdrawal balance if the deposit currency needs to be covered', async () => {
    const { currencyGateway, pendingDepositStub, pendingWithdrawalStub, updateStub, transferToExchangeHoldingsFromMock } = prepareStubs(
      CurrencyCode.kau,
      pendingHoldingsTransferGatekeeper,
      sinon.mock().resolves({ txHash: depositTxHash, transactionFee: holdingsTxFee }),
    )
    sinon.stub(Account, 'hasAccountSuspended').resolves(false)
    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
    )

    const transaction = pendingDepositStub.getCalls()[0].args[0].t
    expect(
      pendingDepositStub.calledWith({
        accountId: depositAddress.accountId,
        amount: depositRequest.amount,
        currencyId: depositRequest.depositAddress.currencyId,
        sourceEventId: depositRequest.id,
        sourceEventType: SourceEventType.currencyDepositRequest,
        t: transaction,
      }),
    ).to.eql(true)

    expect(
      updateStub.calledWith(
        depositRequest.id,
        {
          holdingsTxHash: depositTxHash,
          holdingsTxFee: Number(holdingsTxFee),
          status: DepositRequestStatus.pendingCompletion,
        },
        transaction,
      ),
    ).to.eql(true)
    expect(transferToExchangeHoldingsFromMock.calledWith(decryptedPrivateKey, depositRequest.amount)).to.eql(true)
    expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(0)
    expect(pendingCompletionGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)[0].request).to.eql(depositRequest)

    expect(pendingWithdrawalStub.getCalls().length).to.eql(0)
  })

  it('should create a pendingWithdrawal balance if the deposit currency needs to be covered', async () => {
    const { currencyGateway, pendingDepositStub, pendingWithdrawalStub, updateStub, transferToExchangeHoldingsFromMock } = prepareStubs(
      CurrencyCode.ethereum,
      pendingHoldingsTransferGatekeeper,
      sinon.mock().resolves({ txHash: depositTxHash, transactionFee: holdingsTxFee }),
    )
    sinon.stub(Account, 'hasAccountSuspended').resolves(false)
    await processNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionGatekeeper,
      pendingSuspendedDepositGatekeeper,
      CurrencyCode.ethereum,
      currencyGateway as any,
    )

    const transaction = pendingDepositStub.getCalls()[0].args[0].t
    expect(
      pendingDepositStub.calledWith({
        accountId: depositAddress.accountId,
        amount: depositRequest.amount,
        currencyId: depositRequest.depositAddress.currencyId,
        sourceEventId: depositRequest.id,
        sourceEventType: SourceEventType.currencyDepositRequest,
        t: transaction,
      }),
    ).to.eql(true)

    expect(
      updateStub.calledWith(
        depositRequest.id,
        {
          holdingsTxHash: depositTxHash,
          holdingsTxFee: Number(holdingsTxFee),
          status: DepositRequestStatus.pendingCompletion,
        },
        transaction,
      ),
    ).to.eql(true)
    expect(transferToExchangeHoldingsFromMock.calledWith(decryptedPrivateKey, depositRequest.amount)).to.eql(true)
    expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.ethereum).length).to.eql(0)
    expect(pendingCompletionGatekeeper[currencyToDepositRequests].get(CurrencyCode.ethereum)[0].request).to.eql(depositRequest)

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
    getCurrencyFromTicker: () => ({
      checkConfirmationOfTransaction: sinon.mock().resolves(true),
    }),
    getCurrencyFromId: () =>
      Promise.resolve({
        transferToExchangeHoldingsFrom: transferToExchangeHoldingsFromMock,
        balanceAt: () => Promise.resolve(balance),
        ticker: currencyToStub,
      }),
  }

  sinon.stub(privateKeyOperations, 'decryptValue').resolves(decryptedPrivateKey)
  const pendingDepositStub = sinon.stub(BalanceMovementFacade.prototype, 'createPendingDeposit')
  const pendingWithdrawalStub = sinon.stub(BalanceMovementFacade.prototype, 'createPendingWithdrawal')
  const updateStub = sinon.stub(depositRequestOperations, 'updateDepositRequest').resolves(depositRequest)

  return {
    currencyGateway,
    transferToExchangeHoldingsFromMock,
    pendingDepositStub,
    pendingWithdrawalStub,
    updateStub,
  }
}
