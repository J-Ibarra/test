// import { expect } from 'chai'
import { Decimal } from 'decimal.js'
import sinon from 'sinon'
import { initialiseWithdrawal, CryptoWithdrawalGatekeeper } from '..'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
// tslint:disable-next-line: ordered-imports
import * as blockChainOperations from '@abx-utils/blockchain-currency-gateway'
import { truncateTables } from '@abx-utils/db-connection-utils'
import * as realTimeMidPriceCalculationOperations from '@abx-service-clients/market-data'
import * as fxRateProvider from '@abx-utils/fx-rate'
import { InitialiseWithdrawalParams, WithdrawalState } from '@abx-types/withdrawal'
import { findWithdrawalRequest } from '../lib'
import { validatePartialMatch, stubFindCurrencyForCodesCall, stubFindCurrencyBalancesCall, USD, stubAccountCreation } from './utils'
import * as balanceOperations from '@abx-service-clients/balance'
import * as accountOperations from '@abx-service-clients/account'
import * as adminOperations from '@abx-service-clients/admin-fund-management'
import * as notificationOperations from '@abx-service-clients/notification'

import { AccountStatus } from '@abx-types/account'
import { TEST_CURRENCY_TICKER } from '@abx-utils/blockchain-currency-gateway'
import { expect } from 'chai'
import { SourceEventType } from '@abx-types/balance'
import { CurrencyCode } from '@abx-types/reference-data'

const testCurrencyId = 1

describe('Withdrawal Request Initialisation', () => {
  const sandbox = sinon.createSandbox()
  let createPendingDepositStub
  let createPendingWithdrawalStub
  let saveClientTriggeredFiatWithdrawalAdminRequestStub
  const depthMidPrice = 10
  const fxQuote = new Decimal(1)
  let pendingHoldingsAccountTransferGatekeeper: CryptoWithdrawalGatekeeper
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

    saveClientTriggeredFiatWithdrawalAdminRequestStub = sinon.stub(adminOperations, 'saveClientTriggeredFiatWithdrawalAdminRequest').resolves({
      globalTransactionId: 'fooTx',
    })
    createPendingDepositStub = sinon.stub(balanceOperations, 'createPendingDeposit').resolves()
    createPendingWithdrawalStub = sinon.stub(balanceOperations, 'createPendingWithdrawal').resolves()

    pendingHoldingsAccountTransferGatekeeper = new CryptoWithdrawalGatekeeper('test')

    sinon.stub(fxRateProvider, 'convertAndTruncateCurrencyValue').callsFake(amount => `${amount}`)
    sinon.stub(fxRateProvider, 'convertAmountToFiatCurrency').callsFake((a, b, amount) => {
      console.log(a, b)
      return amount
    })
  })

  afterEach(() => {
    sandbox.restore()
    sinon.restore()
  })

  describe('initialiseWithdrawal', () => {
    it('creates withdrawal in pending state and balance adjustment for given account and crypto currency', async () => {
      const address = 'test-address'
      const amount = 10
      const startingBalance = 100
      const memo = 'Test Memo Text'
      const feeAmount = 0

      const account = await stubAccountCreation()
      sinon.stub(blockChainOperations.CurrencyManager.prototype, 'getCurrencyFromTicker').returns({
        ticker: TEST_CURRENCY_TICKER,
        validateAddressIsNotContractAddress: () => Promise.resolve(true),
        validateAddress: () => Promise.resolve(true),
        getHoldingBalance: () => Promise.resolve(1000),
      })
      sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
        feeCurrency: TEST_CURRENCY_TICKER,
        feeAmount,
        minimumAmount: 5,
      })
      stubFindCurrencyBalancesCall(TEST_CURRENCY_TICKER, startingBalance)
      stubFindCurrencyForCodesCall(blockChainOperations.TEST_CURRENCY_TICKER)

      const withdrawalParams: InitialiseWithdrawalParams = {
        accountId: account.id,
        address,
        amount,
        currencyCode: blockChainOperations.TEST_CURRENCY_TICKER,
        memo,
      }

      await initialiseWithdrawal(withdrawalParams, pendingHoldingsAccountTransferGatekeeper)
      const withdrawalRequest = await findWithdrawalRequest({ accountId: account.id })
      validatePartialMatch(
        {
          accountId: account.id,
          address,
          amount,
          currencyId: testCurrencyId,
          state: WithdrawalState.pending,
          memo,
        },
        withdrawalRequest,
      )

      expect(
        createPendingDepositStub.calledWith({
          accountId: kinesisRevenueAccount.id,
          amount: feeAmount,
          currencyId: testCurrencyId,
          sourceEventId: withdrawalRequest!.id!,
          sourceEventType: SourceEventType.currencyWithdrawalFee,
        }),
      ).to.eql(true)
      expect(
        createPendingWithdrawalStub.calledWith({
          pendingWithdrawalParams: {
            accountId: withdrawalRequest!.accountId,
            amount: withdrawalRequest!.amount,
            currencyId: testCurrencyId,
            sourceEventId: withdrawalRequest!.id!,
            sourceEventType: SourceEventType.currencyWithdrawalFee,
          },
        }),
      ).to.eql(true)
    }).timeout(60_000)

    it('creates withdrawal in requested state and balance adjustment for given account and fiat currency', async () => {
      const amount = 10
      const startingBalance = 100
      const feeAmount = 15

      const kycAccount = await stubAccountCreation()
      const withdrawalParams: InitialiseWithdrawalParams = {
        accountId: kycAccount.id,
        amount,
        currencyCode: CurrencyCode.usd,
      }

      sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
        feeCurrency: CurrencyCode.usd,
        feeAmount,
        minimumAmount: 5,
      })
      stubFindCurrencyBalancesCall(CurrencyCode.usd, startingBalance)
      stubFindCurrencyForCodesCall(USD.code)

      await initialiseWithdrawal(withdrawalParams, pendingHoldingsAccountTransferGatekeeper)
      const withdrawalRequest = await findWithdrawalRequest({ accountId: kycAccount.id })
      validatePartialMatch(
        {
          accountId: kycAccount.id,
          address: null,
          amount,
          currencyId: USD.id,
          state: WithdrawalState.pending,
          txHash: null,
        },
        withdrawalRequest,
      )

      expect(saveClientTriggeredFiatWithdrawalAdminRequestStub.calledWith(kycAccount.id, USD.code, amount, undefined))
    })

    it('throws error and makes no balance adjustment if account has insufficient currency balance', async () => {
      const amount = 1.5

      const account = await stubAccountCreation()

      const withdrawalParams: InitialiseWithdrawalParams = {
        accountId: account.id,
        amount,
        currencyCode: CurrencyCode.usd,
      }
      sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
        feeCurrency: CurrencyCode.usd,
        feeAmount: 25,
        minimumAmount: 5,
      })
      stubFindCurrencyBalancesCall(CurrencyCode.usd, 0)
      stubFindCurrencyForCodesCall(USD.code)

      try {
        await initialiseWithdrawal(withdrawalParams, pendingHoldingsAccountTransferGatekeeper)

        throw new Error(`Incorrect error thrown`)
      } catch ({ message }) {
        expect(message).to.equal(`Withdrawal request amount ${USD.code}${amount} and fee 25 is greater than available balance`)
        expect(saveClientTriggeredFiatWithdrawalAdminRequestStub.calledOnce).to.eql(false)
      }
    })

    it('throws error and makes no balance adjustment if memo length is greater than 25 characters', async () => {
      const account = await stubAccountCreation()
      const amount = 10
      const address = 'test-address'
      const memo = 'x'.repeat(26)
      const startingBalance = 100

      sinon.stub(blockChainOperations.CurrencyManager.prototype, 'getCurrencyFromTicker').returns({
        ticker: TEST_CURRENCY_TICKER,
        validateAddressIsNotContractAddress: () => Promise.resolve(true),
        validateAddress: () => Promise.resolve(true),
        getHoldingBalance: () => Promise.resolve(1000),
      })
      sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
        feeCurrency: TEST_CURRENCY_TICKER,
        feeAmount: 0,
        minimumAmount: 5,
      })
      stubFindCurrencyBalancesCall(TEST_CURRENCY_TICKER, startingBalance)
      stubFindCurrencyForCodesCall(blockChainOperations.TEST_CURRENCY_TICKER)

      const withdrawalParams: InitialiseWithdrawalParams = {
        accountId: account.id,
        address,
        amount,
        currencyCode: TEST_CURRENCY_TICKER,
        memo,
      }

      try {
        await initialiseWithdrawal(withdrawalParams, pendingHoldingsAccountTransferGatekeeper)

        throw new Error(`Incorrect error thrown`)
      } catch ({ message }) {
        expect(message).to.equal(`Withdrawal request memo must not be more than than 25 characters in length`)

        expect(createPendingDepositStub.calledOnce).to.eql(false)
      }
    })

    it('throws ValidationError if currency is fiat and account is not KYC verified', async () => {
      const amount = 10
      const startingBalance = 100

      const account = await stubAccountCreation(AccountStatus.emailVerified)
      const withdrawalParams: InitialiseWithdrawalParams = {
        accountId: account.id,
        amount,
        currencyCode: CurrencyCode.usd,
      }

      stubAccountCreation(AccountStatus.emailVerified)
      sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
        feeCurrency: USD.code,
        feeAmount: 0,
        minimumAmount: 5,
      })
      stubFindCurrencyBalancesCall(CurrencyCode.usd, startingBalance)
      stubFindCurrencyForCodesCall(USD.code)

      try {
        await initialiseWithdrawal(withdrawalParams, pendingHoldingsAccountTransferGatekeeper)

        throw new Error(`Incorrect error thrown`)
      } catch ({ message }) {
        expect(message).to.equal(`Fiat withdrawals can only be made by accounts whose identity has been verified`)

        expect(createPendingDepositStub.calledOnce).to.eql(false)
      }
    })

    it.skip('Handles error if amount exceeds holdings balance', async () => {
      sinon.restore()
      const address = 'test-address'
      const amount = 51 // test currency holding balance is 50
      const startingBalance = 100

      const account = await stubAccountCreation()
      sinon.stub(blockChainOperations.CurrencyManager.prototype, 'getCurrencyFromTicker').returns({
        ticker: TEST_CURRENCY_TICKER,
        validateAddressIsNotContractAddress: () => Promise.resolve(true),
        validateAddress: () => Promise.resolve(true),
        getHoldingBalance: () => Promise.resolve(50),
      })
      sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({
        feeCurrency: TEST_CURRENCY_TICKER,
        feeAmount: 0,
        minimumAmount: 5,
      })
      stubFindCurrencyBalancesCall(TEST_CURRENCY_TICKER, startingBalance)
      stubFindCurrencyForCodesCall(blockChainOperations.TEST_CURRENCY_TICKER)

      try {
        sinon.stub(notificationOperations, 'sendNotificationToOps').resolves()
        await initialiseWithdrawal(
          {
            accountId: account.id,
            address,
            amount,
            currencyCode: TEST_CURRENCY_TICKER,
          },
          pendingHoldingsAccountTransferGatekeeper,
        )
      } catch (error) {
        expect(error.message).to.eql('We are unable to automatically process your withdrawal right now but will manually process it in due course')
      }
      const withdrawalRequest = await findWithdrawalRequest({ accountId: account.id })

      expect(withdrawalRequest).to.equal(null)
    })
  })
})
