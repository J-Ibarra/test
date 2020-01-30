// import { expect } from 'chai'
import { Decimal } from 'decimal.js'
import sinon from 'sinon'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
// tslint:disable-next-line: ordered-imports
import { truncateTables } from '@abx/db-connection-utils'
import * as realTimeMidPriceCalculationOperations from '@abx-service-clients/market-data'
import * as fxRateProvider from '@abx-utils/fx-rate'
import { WithdrawalState, WithdrawalRequestType } from '@abx-types/withdrawal'
import {
  findWithdrawalRequest,
  createWithdrawalRequest,
  completeFiatWithdrawal,
  findWithdrawalRequests,
  CryptoWithdrawalGatekeeper,
  completeWithdrawal,
} from '..'
import { USD, stubAccountCreation, KAU } from './utils'
import * as balanceOperations from '@abx-service-clients/balance'
import * as accountOperations from '@abx-service-clients/account'
import * as orderOperations from '@abx-service-clients/order'
import * as notificationOperations from '@abx-service-clients/notification'

import { TEST_CURRENCY_TICKER } from '@abx-query-libs/blockchain-currency-gateway'
import { expect } from 'chai'
import { SourceEventType } from '@abx-types/balance'
import { FiatCurrency } from '@abx-types/reference-data'
import { TransactionDirection } from '@abx-types/order'

const testCurrency = {
  code: TEST_CURRENCY_TICKER,
  id: 3,
}

describe('Withdrawal Request Completion', () => {
  const sandbox = sinon.createSandbox()
  let createCurrencyTransactionStub
  let updateAvailableStub
  let pendingCompletionGatekeeper: CryptoWithdrawalGatekeeper
  const depthMidPrice = 10
  const fxQuote = new Decimal(1)
  const kinesisRevenueAccount = { id: 'revenue-acc-id-1' } as any

  beforeEach(async () => {
    sinon.restore()
    await truncateTables()
    sandbox.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({ minAmount: 0, maxDecimals: 10 })
    sandbox.stub(referenceDataOperations, 'validateValueWithinBoundary').returns({ valid: true, expects: '' })
    sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(1500)
    sinon
      .stub(referenceDataOperations, 'findCurrencyForCode')
      .withArgs(USD.code)
      .resolves({ id: USD.id })

    sandbox.stub(realTimeMidPriceCalculationOperations, 'calculateRealTimeMidPriceForSymbol').resolves(depthMidPrice)
    sandbox.stub(fxRateProvider, 'getQuoteFor').resolves(fxQuote)
    sinon.stub(accountOperations, 'findOrCreateKinesisRevenueAccount').resolves(kinesisRevenueAccount)

    sinon.stub(fxRateProvider, 'convertAndTruncateCurrencyValue').callsFake(amount => `${amount}`)
    sinon.stub(fxRateProvider, 'convertAmountToFiatCurrency').callsFake((a, b, amount) => {
      console.log(a, b)
      return amount
    })
    createCurrencyTransactionStub = sinon.stub(orderOperations, 'createCurrencyTransaction').resolves()
    updateAvailableStub = sinon.stub(balanceOperations, 'updateAvailable').resolves()
    pendingCompletionGatekeeper = new CryptoWithdrawalGatekeeper('pending-completion')
  })

  afterEach(() => {
    sandbox.restore()
    sinon.restore()
  })

  describe('completeFiatWithdrawal', () => {
    it('updates withdrawal state to completed, with balance adjustment and currency transaction', async () => {
      const amount = 1.5
      const account = await stubAccountCreation()
      const feeAmount = 20

      sinon.stub(balanceOperations, 'findBalance').resolves({ available: { value: 100 } })
      sinon.stub(referenceDataOperations, 'findCurrencyForId').resolves(USD)
      sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
        feeCurrency: TEST_CURRENCY_TICKER,
        feeAmount,
        minimumAmount: 5,
      })

      await createWithdrawalRequest({
        accountId: account.id,
        amount,
        currencyId: USD.id,
        state: WithdrawalState.pending,
        fiatCurrencyCode: FiatCurrency.usd,
        fiatConversion: 0,
        kauConversion: 0,
        type: WithdrawalRequestType.withdrawal,
        adminRequestId: 1,
      })
      const withdrawalRequest = await findWithdrawalRequest({ accountId: account.id })

      await completeFiatWithdrawal({ adminRequestId: withdrawalRequest!.adminRequestId! })
      const completedWithdrawal = (await findWithdrawalRequest({ adminRequestId: withdrawalRequest!.adminRequestId! }))!

      expect(completedWithdrawal.accountId).to.equal(account.id)
      expect(completedWithdrawal.amount).to.equal(amount)
      expect(completedWithdrawal.address).to.equal(null)
      expect(completedWithdrawal.currencyId).to.equal(USD.id)
      expect(completedWithdrawal.state).to.equal(WithdrawalState.completed)

      expect(
        createCurrencyTransactionStub.calledWith({
          accountId: completedWithdrawal.accountId,
          amount: completedWithdrawal.amount + feeAmount,
          currencyId: completedWithdrawal.currencyId,
          direction: TransactionDirection.withdrawal,
          requestId: completedWithdrawal.id!,
        }),
      ).to.eql(true)

      expect(
        updateAvailableStub.calledWith({
          accountId: kinesisRevenueAccount.id,
          amount: feeAmount,
          currencyId: withdrawalRequest!.currencyId,
          sourceEventId: withdrawalRequest!.id!,
          sourceEventType: SourceEventType.currencyWithdrawal,
        }),
      ).to.eql(true)
      expect(
        updateAvailableStub.calledWith({
          accountId: withdrawalRequest!.accountId,
          amount: -(withdrawalRequest!.amount + feeAmount),
          currencyId: withdrawalRequest!.currencyId,
          sourceEventId: withdrawalRequest!.id!,
          sourceEventType: SourceEventType.currencyWithdrawal,
        }),
      ).to.eql(true)
    })

    it('throws error if withdrawal request does not exist', async () => {
      const adminRequestId = 1
      const withdrawalConfirmParams = {
        adminRequestId,
      }

      try {
        await completeFiatWithdrawal(withdrawalConfirmParams)

        throw new Error(`Incorrect error thrown`)
      } catch ({ message }) {
        expect(message).to.equal(`No withdrawal request exists for admin request id ${adminRequestId}`)
      }
    })

    it('throws error if withdrawal request currency is not a valid fiat currency', async () => {
      const account = await stubAccountCreation()

      await createWithdrawalRequest({
        accountId: account.id,
        amount: 1,
        currencyId: KAU.id,
        state: WithdrawalState.pending,
        fiatCurrencyCode: FiatCurrency.usd,
        fiatConversion: 0,
        kauConversion: 0,
        type: WithdrawalRequestType.withdrawal,
        adminRequestId: 1,
      })
      const withdrawalRequest = await findWithdrawalRequest({ accountId: account.id })

      const withdrawalConfirmParams = {
        adminRequestId: withdrawalRequest!.id!,
      }

      try {
        sinon.stub(balanceOperations, 'findBalance').resolves({ available: { value: 100 } })
        sinon.stub(referenceDataOperations, 'findCurrencyForId').resolves(KAU)
        sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
          feeCurrency: KAU.code,
          feeAmount: 0,
          minimumAmount: 5,
        })
        await completeFiatWithdrawal(withdrawalConfirmParams)

        throw new Error(`Incorrect error thrown`)
      } catch ({ message }) {
        expect(message).to.equal(`Withdrawal request currency ${KAU.code} is not a valid fiat currency`)
      }
    })
  })

  it('only completes withdrawal if txHash is present', async () => {
    const account = await stubAccountCreation()
    const startingBalance = 500
    const feeAmount = 5

    const triggerMultipleBalanceChangesStub = sinon.stub(balanceOperations, 'triggerMultipleBalanceChanges').resolves()

    sinon.stub(accountOperations, 'findUserByAccountId').resolves(account)
    sinon.stub(balanceOperations, 'findBalance').resolves({ available: { value: startingBalance } })
    sinon.stub(referenceDataOperations, 'findCurrencyForId').resolves(USD)
    sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
      feeCurrency: TEST_CURRENCY_TICKER,
      feeAmount,
      minimumAmount: 5,
    })
    sinon.stub(notificationOperations, 'createEmail').resolves()

    const request1 = await createWithdrawalRequest({
      accountId: account.id,
      address: 'test-address',
      amount: 10,
      currencyId: testCurrency.id,
      state: WithdrawalState.pending,
      fiatCurrencyCode: FiatCurrency.usd,
      fiatConversion: 0,
      kauConversion: 0,
      type: WithdrawalRequestType.withdrawal,
    })

    const request2 = await createWithdrawalRequest({
      accountId: account.id,
      address: 'test-address',
      amount: 20,
      currencyId: testCurrency.id,
      state: WithdrawalState.pending,
      fiatCurrencyCode: FiatCurrency.usd,
      fiatConversion: 0,
      kauConversion: 0,
      type: WithdrawalRequestType.withdrawal,
    })

    pendingCompletionGatekeeper.addNewWithdrawalRequestForCurrency(TEST_CURRENCY_TICKER, {
      withdrawalRequest: { ...request1, txHash: 'foo', currency: testCurrency },
    })
    pendingCompletionGatekeeper.addNewWithdrawalRequestForCurrency(TEST_CURRENCY_TICKER, {
      withdrawalRequest: { ...request2, txHash: 'unconfirmed', currency: testCurrency },
    })

    const testManager1 = {
      getCurrencyFromTicker: () => ({
        checkConfirmationOfTransaction: sinon.stub().resolves(true),
      }),
    } as any

    await completeWithdrawal(TEST_CURRENCY_TICKER, testManager1, pendingCompletionGatekeeper)

    const testManager2 = {
      getCurrencyFromTicker: () => ({
        checkConfirmationOfTransaction: sinon.stub().resolves(false),
      }),
    } as any
    await completeWithdrawal(TEST_CURRENCY_TICKER, testManager2, pendingCompletionGatekeeper)

    const completedWithdrawals = await findWithdrawalRequests({
      state: WithdrawalState.completed,
    })
    expect(completedWithdrawals.length).to.equal(1)
    expect(completedWithdrawals.map(({ id }) => id)).not.to.include(request2!.id!)

    expect(
      triggerMultipleBalanceChangesStub.calledWith([
        {
          type: balanceOperations.BalanceAsyncRequestType.confirmPendingDeposit,
          payload: {
            accountId: kinesisRevenueAccount.id,
            amount: new Decimal(feeAmount).minus(request1.kinesisCoveredOnChainFee!).toNumber(),
            currencyId: request1!.currencyId,
            sourceEventId: request1.id!,
            sourceEventType: SourceEventType.currencyWithdrawal,
          },
        },
        {
          type: balanceOperations.BalanceAsyncRequestType.confirmPendingWithdrawal,
          payload: {
            accountId: request1.accountId,
            amount: request1.amount + feeAmount,
            currencyId: request1.currencyId,
            sourceEventId: request1.id!,
            sourceEventType: SourceEventType.currencyWithdrawal,
          },
        },
      ]),
    )
  }).timeout(60_000)
})
