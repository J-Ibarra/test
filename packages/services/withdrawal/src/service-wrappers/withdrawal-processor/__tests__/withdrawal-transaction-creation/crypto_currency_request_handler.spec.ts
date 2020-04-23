import { handleCryptoCurrencyWithdrawalRequest } from '../../core/withdrawal-transaction-creation/crypto_currency_request_handler'
import * as validatorOperations from '../../core/withdrawal-transaction-creation/withdrawal_status_validators'
import * as coreWithdrawalOperations from '../../../../core'
import * as dispatcherOperations from '../../core/withdrawal-transaction-creation/withdrawal-transaction-dispatcher'

import sinon from 'sinon'
import { expect } from 'chai'
import { CurrencyCode } from '@abx-types/reference-data'
import { WithdrawalState } from '@abx-types/withdrawal'

describe('handleCryptoCurrencyWithdrawalRequest', () => {
  const withdrawalRequest = {
    id: 1,
    amount: 10,
    accountId: 'foo-account-id',
    memo: 'memo',
    address: 'withdrawal-address',
    currency: {
      id: 1,
      code: CurrencyCode.bitcoin,
    },
  } as any
  const onChainCurrencyGateway = {} as any

  afterEach(() => sinon.restore())

  it('should not process request and update status to waiting if waiting requests already exist', async () => {
    sinon.stub(validatorOperations, 'waitingWithdrawalsExistForCurrency').resolves(true)
    const updateWithdrawalRequestStub = sinon.stub(coreWithdrawalOperations, 'updateWithdrawalRequest').resolves()

    await handleCryptoCurrencyWithdrawalRequest(withdrawalRequest, onChainCurrencyGateway)

    expect(
      updateWithdrawalRequestStub.calledWith({
        state: WithdrawalState.waiting,
        id: withdrawalRequest.id,
      }),
    ).to.eql(true)
  })

  it('should verify sufficient amount in holdings wallet and dispatch transaction', async () => {
    sinon.stub(validatorOperations, 'waitingWithdrawalsExistForCurrency').resolves(false)
    const verifySufficientAmountInHoldingWalletStub = sinon.stub(validatorOperations, 'verifySufficientAmountInHoldingWallet').resolves()
    const dispatchWithdrawalTransactionStub = sinon.stub(dispatcherOperations, 'dispatchWithdrawalTransaction').resolves()

    await handleCryptoCurrencyWithdrawalRequest(withdrawalRequest, onChainCurrencyGateway)

    expect(
      verifySufficientAmountInHoldingWalletStub.calledWith({
        accountId: withdrawalRequest.accountId,
        amount: withdrawalRequest.amount,
        memo: withdrawalRequest.memo,
        address: withdrawalRequest.address,
        currency: withdrawalRequest.currency.code,
        onChainCurrencyGateway,
      }),
    ).to.eql(true)
    expect(
      dispatchWithdrawalTransactionStub.calledWith(
        withdrawalRequest.id,
        withdrawalRequest.address,
        withdrawalRequest.amount,
        onChainCurrencyGateway,
        withdrawalRequest.memo,
      ),
    ).to.eql(true)
  })
})
