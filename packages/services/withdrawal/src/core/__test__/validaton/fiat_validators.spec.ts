import { expect } from 'chai'
import Decimal from 'decimal.js'
import moment from 'moment'
import sinon from 'sinon'

import { Environment, Currency, CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { Account, AccountStatus } from '@abx-types/account'
import { BalanceTypeObj } from '@abx-types/balance'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import * as conversion from '@abx-utils/fx-rate'
import { WithdrawalRequest, WithdrawalRequestType, WithdrawalState } from '@abx-types/withdrawal'
import * as helper from '../../lib'
import { createWithdrawalRequest } from '../../lib'
import { createAccountsAndWithdrawalFunctions } from '../initialisation_helper'

let accountGiver: Account
let fiatUsdCurrency: Currency
const withdrawalLimit = {
  [AccountStatus.emailVerified]: 250,
  [AccountStatus.kycVerified]: 800,
  [AccountStatus.superUser]: 1500,
}

const manager = new CurrencyManager(Environment.test, [CurrencyCode.kau])

describe('fiat_validators', async () => {
  describe('isWithdrawalRequestWithinDailyLimit', () => {
    beforeEach(async () => {
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({
        id: 1,
        minAmount: 10,
        maxDecimals: 4,
        currencyCode: CurrencyCode.usd,
      })

      const { accountOne, usdCurrency } = await createAccountsAndWithdrawalFunctions()
      accountGiver = accountOne
      fiatUsdCurrency = usdCurrency
    })

    afterEach(() => {
      sinon.restore()
    })

    it('returns false if withdrawal amount converted to KAU is greater than withdrawal limit in KAU', async () => {
      const amount = 800
      const fakeKauConversionRate = 1.25
      const kauConversion = amount * fakeKauConversionRate

      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves(kauConversion.toString())
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(700)

      const isWithinDailyLimit = await helper.isWithdrawalRequestWithinDailyLimit({
        account: accountGiver,
        amount,
        currencyCode: fiatUsdCurrency.code,
      })

      expect(isWithinDailyLimit).to.eql(false)
      const conversionArgs = conversionStub.getCalls()[0].args
      expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
    })

    it("returns false if the sum of previous 24hr withdrawals' KAU conversion is already greater than the withdrawal limit", async () => {
      await createWithdrawal({
        amount: 1000,
        state: WithdrawalState.completed,
        currencyId: fiatUsdCurrency.id,
        kauConversion: withdrawalLimit[AccountStatus.kycVerified] + 1,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      const amount = 800
      const fakeKauConversionRate = 1.25
      const kauConversion = amount * fakeKauConversionRate
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves(kauConversion.toString())
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(700)

      const isWithinDailyLimit = await helper.isWithdrawalRequestWithinDailyLimit({
        account: accountGiver,
        amount,
        currencyCode: fiatUsdCurrency.code,
      })

      expect(isWithinDailyLimit).to.equal(false)
      const conversionArgs = conversionStub.getCalls()[0].args
      expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
    })

    it("returns false if the sum of previous 24hr withdrawals' KAU conversion plus the requested amount converted into KAU is greater than the withdrawal limit", async () => {
      const amount = 800
      const existingKauValueOfWithdrawals = 500
      await createWithdrawal({
        amount: 500,
        state: WithdrawalState.completed,
        currencyId: fiatUsdCurrency.id,
        kauConversion: existingKauValueOfWithdrawals,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      await createWithdrawal({
        amount: 500,
        state: WithdrawalState.completed,
        currencyId: fiatUsdCurrency.id,
        kauConversion: existingKauValueOfWithdrawals,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
        createdAt: moment()
          .subtract(25, 'hours')
          .toDate(),
      })

      const fakeKauConversionRate = 1.25
      const kauConversion = amount * fakeKauConversionRate
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves(kauConversion.toString())
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(1200)

      const isWithinDailyLimit = await helper.isWithdrawalRequestWithinDailyLimit({
        account: accountGiver,
        amount,
        currencyCode: fiatUsdCurrency.code,
      })

      expect(isWithinDailyLimit).to.equal(false)
      const conversionArgs = conversionStub.getCalls()[0].args
      expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
    })

    it("returns true when the sum of non-cancelled previous 24hr withdrawals' KAU conversion plus requested amount converted into KAU is within the withdrawal limit", async () => {
      await createWithdrawal({
        amount: 500,
        state: WithdrawalState.completed,
        currencyId: fiatUsdCurrency.id,
        kauConversion: 100,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      await createWithdrawal({
        amount: 500,
        state: WithdrawalState.completed,
        currencyId: fiatUsdCurrency.id,
        kauConversion: 75,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      await createWithdrawal({
        amount: 500,
        state: WithdrawalState.cancelled,
        currencyId: fiatUsdCurrency.id,
        kauConversion: 800,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      const amount = 500

      const fakeKauConversionRate = 1.25
      const kauConversion = amount * fakeKauConversionRate
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves(kauConversion.toString())
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(2000)

      const isWithinLimit = await helper.isWithdrawalRequestWithinDailyLimit({
        account: accountGiver,
        amount,
        currencyCode: fiatUsdCurrency.code,
      })
      expect(isWithinLimit).to.eql(true)

      const conversionArgs = conversionStub.getCalls()[0].args
      expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
    })
  })

  describe('validateWithdrawal', () => {
    let usdFiatBalance: BalanceTypeObj

    beforeEach(async () => {
      const { accountOne, usdCurrency, usdBalance } = await createAccountsAndWithdrawalFunctions()
      accountGiver = accountOne
      fiatUsdCurrency = usdCurrency
      usdFiatBalance = { id: usdBalance.id, value: usdBalance.value }
    })

    afterEach(() => {
      sinon.restore()
    })

    it('throws error if account is suspended', async () => {
      accountGiver.suspended = true
      const amount = 50
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves('100')
      sinon.stub(referenceDataOperations, 'validateValueWithinBoundary').resolves({ valid: true })
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(10000)
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({
        id: 1,
        minAmount: 10,
        maxDecimals: 4,
        currencyCode: CurrencyCode.usd,
      })

      try {
        await helper.validateWithdrawal({
          currency: fiatUsdCurrency,
          currencyCode: fiatUsdCurrency.code,
          amount,
          availableBalance: usdFiatBalance,
          account: accountGiver,
          manager,
          feeCurrency: fiatUsdCurrency,
          feeCurrencyAvailableBalance: usdFiatBalance,
          feeAmount: 10,
        })
        throw new Error(`Wrong error thrown`)
      } catch (e) {
        expect(e.message).to.equal(`Account is suspended`)

        const conversionArgs = conversionStub.getCalls()[0].args
        expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
      }
    })

    it("throws error if currency isn't supported", async () => {
      const amount = 50
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves('100')
      sinon.stub(referenceDataOperations, 'validateValueWithinBoundary').resolves({ valid: true })
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(10000)
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({
        id: 1,
        minAmount: 10,
        maxDecimals: 4,
        currencyCode: CurrencyCode.usd,
      })

      try {
        await helper.validateWithdrawal({
          currency: undefined as any,
          currencyCode: fiatUsdCurrency.code,
          amount: 50,
          availableBalance: usdFiatBalance,
          account: accountGiver,
          manager,
          feeCurrency: fiatUsdCurrency,
          feeCurrencyAvailableBalance: usdFiatBalance,
          feeAmount: 10,
        })
        throw new Error(`Wrong error thrown`)
      } catch (e) {
        expect(e.message).to.equal(`Currency ${fiatUsdCurrency.code} not supported`)

        const conversionArgs = conversionStub.getCalls()[0].args
        expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
      }
    })

    it('throws error if withdrawal request amount is greater than available balance', async () => {
      const balance = { id: 1, value: 10 }
      const amount = balance.value + 1
      const feeAmount = 10
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves('100')
      sinon.stub(referenceDataOperations, 'validateValueWithinBoundary').returns({ valid: true })
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(10000)
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({
        id: 1,
        minAmount: 10,
        maxDecimals: 4,
        currencyCode: CurrencyCode.usd,
      })

      try {
        await helper.validateWithdrawal({
          currency: fiatUsdCurrency,
          currencyCode: fiatUsdCurrency.code,
          amount,
          availableBalance: balance,
          account: accountGiver,
          manager,
          feeCurrency: fiatUsdCurrency,
          feeCurrencyAvailableBalance: balance,
          feeAmount,
        })

        throw new Error(`Wrong error thrown`)
      } catch (e) {
        expect(e.message).to.equal(
          `Withdrawal request amount ${fiatUsdCurrency.code}${amount} and fee ${feeAmount} is greater than available balance`,
        )

        const conversionArgs = conversionStub.getCalls()[0].args
        expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
      }
    })

    it('throws error if amount is <= 0', async () => {
      const amount = 0
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves('100')
      sinon.stub(referenceDataOperations, 'validateValueWithinBoundary').returns({ valid: true })
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(10000)
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({
        id: 1,
        minAmount: 10,
        maxDecimals: 4,
        currencyCode: CurrencyCode.usd,
      })

      try {
        await helper.validateWithdrawal({
          currency: fiatUsdCurrency,
          currencyCode: fiatUsdCurrency.code,
          amount,
          availableBalance: usdFiatBalance,
          account: accountGiver,
          manager,
          feeCurrency: fiatUsdCurrency,
          feeCurrencyAvailableBalance: usdFiatBalance,
          feeAmount: 10,
        })

        throw new Error(`Wrong error thrown`)
      } catch (e) {
        expect(e.message).to.equal(`Withdrawal request amount 0 must be greater than 0`)

        const conversionArgs = conversionStub.getCalls()[0].args
        expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
      }
    })

    it("throws error if amount is not within the currency's boundary", async () => {
      const amount = 4.000000001
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves('100')
      sinon.stub(referenceDataOperations, 'validateValueWithinBoundary').returns({ valid: false, expects: 'no more than 2 decimal places' })
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(10000)
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({
        id: 1,
        minAmount: 10,
        maxDecimals: 4,
        currencyCode: CurrencyCode.usd,
      })

      try {
        await helper.validateWithdrawal({
          currency: fiatUsdCurrency,
          currencyCode: fiatUsdCurrency.code,
          amount,
          availableBalance: usdFiatBalance,
          account: { ...accountGiver, status: AccountStatus.kycVerified },
          manager,
          feeCurrency: fiatUsdCurrency,
          feeCurrencyAvailableBalance: usdFiatBalance,
          feeAmount: 10,
        })

        throw new Error(`Wrong error thrown`)
      } catch (e) {
        expect(e.message).to.equal(`The amount ${amount} ${fiatUsdCurrency.code} is invalid, it must be no more than 2 decimal places`)

        const conversionArgs = conversionStub.getCalls()[0].args
        expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
      }
    })

    it('throws error if withdrawal memo is greater than 25 characters', async () => {
      const amount = 50
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves('100')
      sinon.stub(referenceDataOperations, 'validateValueWithinBoundary').returns({ valid: true })
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(10000)
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({
        id: 1,
        minAmount: 10,
        maxDecimals: 4,
        currencyCode: CurrencyCode.usd,
      })
      try {
        await helper.validateWithdrawal({
          currency: fiatUsdCurrency,
          currencyCode: fiatUsdCurrency.code,
          amount,
          availableBalance: usdFiatBalance,
          account: accountGiver,
          manager,
          memo: '123456789123456789123456789123456789',
          feeCurrency: fiatUsdCurrency,
          feeCurrencyAvailableBalance: usdFiatBalance,
          feeAmount: 10,
        })

        throw new Error(`Wrong error thrown`)
      } catch (e) {
        expect(e.message).to.equal(`Withdrawal request memo must not be more than than 25 characters in length`)

        const conversionArgs = conversionStub.getCalls()[0].args
        expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
      }
    })

    it('throws error if amount in KAU pushes 24hour KAU conversion of withdrawals over daily limit', async () => {
      const amount = withdrawalLimit[AccountStatus.kycVerified] - 100
      const fakeKauConversionRate = 1.25
      const kauConversion = amount * fakeKauConversionRate
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves(kauConversion.toString())
      sinon.stub(referenceDataOperations, 'validateValueWithinBoundary').returns({ valid: true })
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(100)
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({
        id: 1,
        minAmount: 10,
        maxDecimals: 4,
        currencyCode: CurrencyCode.usd,
      })

      try {
        await helper.validateWithdrawal({
          currency: fiatUsdCurrency,
          currencyCode: fiatUsdCurrency.code,
          amount,
          availableBalance: usdFiatBalance,
          account: accountGiver,
          manager,
          feeCurrency: fiatUsdCurrency,
          feeCurrencyAvailableBalance: usdFiatBalance,
          feeAmount: 10,
        })

        throw new Error(`Wrong error thrown`)
      } catch (e) {
        expect(e.message).to.equal(
          `Withdrawal request for ${amount} USD exceeds the daily withdrawal limit for account ${accountGiver.users![0].email}`,
        )

        const conversionArgs = conversionStub.getCalls()[0].args
        expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
      }
    })

    it('throws error if account status is not kyc verified and currency is fiat', async () => {
      accountGiver.status = AccountStatus.emailVerified
      const amount = 50
      const conversionStub = sinon.stub(conversion, 'convertAndTruncateCurrencyValue').resolves('100')
      sinon.stub(referenceDataOperations, 'validateValueWithinBoundary').returns({ valid: true })
      sinon.stub(referenceDataOperations, 'getWithdrawalLimit').resolves(10000)
      sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({
        id: 1,
        minAmount: 10,
        maxDecimals: 4,
        currencyCode: CurrencyCode.usd,
      })
      try {
        await helper.validateWithdrawal({
          currency: fiatUsdCurrency,
          currencyCode: fiatUsdCurrency.code,
          amount,
          availableBalance: usdFiatBalance,
          account: accountGiver,
          manager,
          feeCurrency: fiatUsdCurrency,
          feeCurrencyAvailableBalance: usdFiatBalance,
          feeAmount: 10,
        })
        throw new Error(`Wrong error thrown`)
      } catch (e) {
        expect(e.message).to.equal(`Fiat withdrawals can only be made by accounts whose identity has been verified`)

        const conversionArgs = conversionStub.getCalls()[0].args
        expect(conversionArgs).to.deep.equal([new Decimal(amount), fiatUsdCurrency.code, CurrencyCode.kau])
      }
    })
  })
})

const createWithdrawal = (withdrawalRequest: Partial<WithdrawalRequest>) => {
  const defaultWithdrawalType = WithdrawalRequestType.withdrawal

  return createWithdrawalRequest({
    ...withdrawalRequest,
    type: withdrawalRequest.type || defaultWithdrawalType,
  } as any)
}
