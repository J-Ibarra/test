import { expect } from 'chai'
import sinon from 'sinon'

import * as User from '@abx-service-clients/account'
import { EmailTemplates } from '@abx-types/notification'
import { CurrencyCode } from '@abx-types/reference-data'
import { completeWithdrawal, CryptoWithdrawalGatekeeper } from '../../..'
import * as withdrawalOperations from '../../../lib'
import * as completionOperations from '../../../lib/completion/crypto'
import { cryptoWithdrawalRequest, currencyToWithdrawalRequestsKey, withdrawalRequest } from '../test-utils'
import * as notificationOperations from '@abx-service-clients/notification'

const pendingCompletionGatekeeper = new CryptoWithdrawalGatekeeper('pending completion')

describe('crypto_request_completer', () => {
  afterEach(() => sinon.restore())

  it('should not execute any logic if no requests in pendingCompletionGatekeeper', async () => {
    const getCurrencyFromTicker = sinon.mock().resolves()
    const manager = {
      getCurrencyFromTicker,
    } as any

    await completeWithdrawal(CurrencyCode.kau, manager, pendingCompletionGatekeeper)

    expect(getCurrencyFromTicker.getCalls().length).to.eql(0)
  })

  it('should not complete withdrawal if transaction not confirmed, addRequestForLaterAttempt should be invoked', async () => {
    pendingCompletionGatekeeper.addNewWithdrawalRequestForCurrency(CurrencyCode.kag, {
      withdrawalRequest: cryptoWithdrawalRequest,
    })
    const checkConfirmationOfTransactionMock = sinon.mock().resolves(false)
    const manager = {
      checkConfirmationOfTransaction: () => Promise.resolve(false),
      getCurrencyFromTicker: () => Promise.resolve({ checkConfirmationOfTransactionMock }),
    } as any

    const completeCryptoWithdrawalStub = sinon.stub(completionOperations, 'completeCryptoWithdrawal')
    await completeWithdrawal(CurrencyCode.kag, manager, pendingCompletionGatekeeper)

    expect(completeCryptoWithdrawalStub.getCalls().length).to.eql(0)
  })

  it('should not complete withdrawal if transaction not confirmed, addRequestForLaterAttempt should be invoked', async () => {
    pendingCompletionGatekeeper.addNewWithdrawalRequestForCurrency(CurrencyCode.kag, {
      withdrawalRequest: cryptoWithdrawalRequest,
    })
    const checkConfirmationOfTransactionMock = sinon.mock().resolves(false)
    const manager = {
      getCurrencyFromTicker: () => ({
        checkConfirmationOfTransaction: checkConfirmationOfTransactionMock,
      }),
    } as any

    const completeCryptoWithdrawalStub = sinon.stub(completionOperations, 'completeCryptoWithdrawal')
    await completeWithdrawal(CurrencyCode.kau, manager, pendingCompletionGatekeeper)

    expect(completeCryptoWithdrawalStub.getCalls().length).to.eql(0)
    expect(pendingCompletionGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kag)![0].lockedUntil).to.not.eql(undefined)
  })

  it('should complete request and remove from pendingCompletionGatekeeper if on chain transaction confirmed', async () => {
    pendingCompletionGatekeeper.addNewWithdrawalRequestForCurrency(CurrencyCode.kag, {
      withdrawalRequest: cryptoWithdrawalRequest,
    })
    const checkConfirmationOfTransactionMock = sinon.mock().resolves(true)
    const manager = {
      getCurrencyFromTicker: () => ({
        checkConfirmationOfTransaction: checkConfirmationOfTransactionMock,
      }),
    } as any

    const createEmailStub = sinon.stub(notificationOperations, 'createEmail').resolves()
    sinon.stub(withdrawalOperations, 'findAndLockWithdrawalRequestById').resolves(withdrawalRequest)
    const completeCryptoWithdrawalStub = sinon.stub(completionOperations, 'completeCryptoWithdrawal').resolves()

    const mockUser = {
      email: 'test@abx.com',
      firstName: 'Jane',
      lastName: 'Doe',
    }
    sinon.stub(User, 'findUserByAccountId').resolves(mockUser)
    const expectEmailRequest = getMockEmailRequest(cryptoWithdrawalRequest, mockUser)

    await completeWithdrawal(CurrencyCode.kag, manager, pendingCompletionGatekeeper)

    expect(completeCryptoWithdrawalStub.getCall(0).args[0]).to.eql(cryptoWithdrawalRequest)
    expect(pendingCompletionGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kag)!.length).to.eql(0)
    expect(createEmailStub.calledWith(expectEmailRequest)).to.eql(true)
  })
})

const getMockEmailRequest = (request, user) => {
  const { email, firstName, lastName } = user
  const name = `${firstName} ${lastName}`
  const templateContent = {
    name,
    withdrawalAmount: `${request.amount}`,
    cryptoSymbol: request.currency.code,
    username: email,
    withdrawalDateUTC: request.createdAt.toUTCString(),
    depositPublicAddress: request.address,
    transactionHash: request.txHash,
  }
  return {
    to: email,
    subject: 'Kinesis Money Crypto Withdraw Success',
    templateName: EmailTemplates.WithdrawalCryptoSuccess,
    templateContent,
  }
}
