import { expect } from 'chai'
import sinon from 'sinon'
import * as notificationOperations from '@abx-service-clients/notification'
import { CurrencyCode } from '@abx-types/reference-data'
import { CryptoWithdrawalGatekeeper, handleCryptoCurrencyWithdrawalRequest } from '../../../framework'
import { WithdrawalRequestType } from '@abx-types/withdrawal'
import * as withdrawalOperations from '../../../lib'
import { currencyToWithdrawalRequestsKey, withdrawalRequest } from '../test-utils'

describe('crypto_currency_request_handler', () => {
  const accountId = 'acc1'
  const withdrawalAmount = 10
  const feeRequest = { ...withdrawalRequest, id: 2, type: WithdrawalRequestType.fee }
  const pendingHoldingsAccountTransferGatekeeper = new CryptoWithdrawalGatekeeper('foo')

  afterEach(() => sinon.restore())

  it('should not initialise crypto withdrawal if holdings balance is less than withdrawal amount', async () => {
    const withdrawalParams = {
      accountId,
      amount: withdrawalAmount,
      currencyCode: CurrencyCode.kau,
      memo: 'foo',
      address: 'addresss',
    }

    const sendNotificationToOpsStub = sinon.stub(notificationOperations, 'sendNotificationToOps').resolves()

    const kauOnchainCurrencyGateway = {
      ticker: CurrencyCode.kau,
      getHoldingBalance: () => Promise.resolve(0 as any),
    } as any

    const withdrawalRequestCurrency = {
      id: 2,
      code: CurrencyCode.kau,
    } as any
    try {
      await handleCryptoCurrencyWithdrawalRequest(
        withdrawalParams,
        withdrawalRequestCurrency,
        withdrawalRequestCurrency,
        kauOnchainCurrencyGateway,
        pendingHoldingsAccountTransferGatekeeper,
      )

      throw new Error(`Wrong error thrown in test`)
    } catch (error) {
      const expectedMessageContent = [
        `Holdings balance 0 is less than withdrawal request amount of ${withdrawalParams.amount} for ${withdrawalParams.currencyCode}`,
        '',
        `Account: ${accountId}`,
        `Amount: ${withdrawalParams.amount}`,
        `Memo: ${withdrawalParams.memo}`,
        `Target Address: ${withdrawalParams.address}`,
        `Currency code: ${withdrawalParams.currencyCode}`,
      ]

      expect(
        sendNotificationToOpsStub.calledWith(
          'Withdrawal amount greater than hot wallet balance',
          expectedMessageContent.join('. '),
          expectedMessageContent.join('<br />'),
        ),
      ).to.eql(true)
      expect(error.message).to.eql('We are unable to automatically process your withdrawal right now but will manually process it in due course')
    }
  })

  it('should initialise cvrypto withdrawal and add request to gatekeeper', async () => {
    const withdrawalParams = {
      accountId,
      amount: withdrawalAmount,
      currencyCode: CurrencyCode.kau,
      memo: 'foo',
      address: 'addresss',
    }

    const kauOnchainCurrencyGateway = {
      ticker: CurrencyCode.kau,
      getHoldingBalance: () => Promise.resolve(10 as any),
    } as any

    const withdrawalRequestCurrency = {
      id: 2,
      code: CurrencyCode.kau,
    } as any

    const initialiseCryptoWithdrawalRequestStub = sinon
      .stub(withdrawalOperations, 'initialiseCryptoWithdrawalRequest')
      .resolves({ amountRequest: withdrawalRequest, feeRequest })

    await handleCryptoCurrencyWithdrawalRequest(
      withdrawalParams,
      withdrawalRequestCurrency,
      withdrawalRequestCurrency,
      kauOnchainCurrencyGateway,
      pendingHoldingsAccountTransferGatekeeper,
    )

    expect(initialiseCryptoWithdrawalRequestStub.getCall(0).args[0]).to.eql(withdrawalParams)
    expect(pendingHoldingsAccountTransferGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kau)![0]).to.eql({
      isLocked: false,
      withdrawalRequest: {
        ...withdrawalRequest,
        currency: withdrawalRequestCurrency,
      },
      feeRequest,
      lockedUntil: undefined,
    })
  })
})
