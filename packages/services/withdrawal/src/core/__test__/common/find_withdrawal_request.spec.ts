import { expect } from 'chai'
import sinon from 'sinon'
import { Account } from '@abx-types/account'
import { updateDumbWithdrawalRequest } from '../utils'
import { Currency, FiatCurrency } from '@abx-types/reference-data'
import { WithdrawalRequest, WithdrawalRequestType, WithdrawalState } from '@abx-types/withdrawal'
import * as helper from '../../lib'
import { createWithdrawalRequest } from '../../lib'
import { createAccountsAndWithdrawalFunctions, sortById } from '../initialisation_helper'
import { truncateTables } from '@abx-utils/db-connection-utils'

const timeToFilterBy = 1000 * 60 * 60 * 24
const outsideTimeFrameDate = new Date(Date.now() - timeToFilterBy * 2)
let accountGiver: Account
let accountReceiver: Account
let fiatUsdCurrency: Currency
let cryptoKauCurrency: Currency

describe('validate_withdrawal_request', async () => {
  const sandbox = sinon.createSandbox()

  after(async () => {
    sandbox.restore()
  })

  describe('findCompletedWithdrawalsForAccount', () => {
    beforeEach(async () => {
      truncateTables()
      const { accountOne, accountTwo, usdCurrency, kauCurrency } = await createAccountsAndWithdrawalFunctions()
      accountGiver = accountOne
      accountReceiver = accountTwo
      fiatUsdCurrency = usdCurrency
      cryptoKauCurrency = kauCurrency
    })

    it('account has no withdrawals, should return empty array', async () => {
      const withdrawalParams = [
        {
          amount: 50,
          state: WithdrawalState.completed,
          currencyId: fiatUsdCurrency.id,
          kauConversion: 5 * 0.1,
          fiatConversion: 0.056,
          fiatCurrencyCode: FiatCurrency.usd,
          accountId: accountReceiver.id,
        },
      ]

      await Promise.all(withdrawalParams.map(createWithdrawal))

      const withdrawals: WithdrawalRequest[] = await helper.findNonCancelledWithdrawalsForTheLast24Hours(accountGiver.id)

      expect(withdrawals.length).to.eql(0)
    })

    it('account only had cancelled withdrawals. Should return empty array', async () => {
      const withdrawalParams = [
        {
          amount: 5,
          state: WithdrawalState.cancelled,
          currencyId: fiatUsdCurrency.id,
          kauConversion: 5 * 0.1,
          fiatConversion: 0.056,
          fiatCurrencyCode: FiatCurrency.usd,
          accountId: accountGiver.id,
        },
        {
          amount: 22,
          state: WithdrawalState.cancelled,
          currencyId: fiatUsdCurrency.id,
          kauConversion: 5 * 0.1,
          fiatConversion: 0.056,
          fiatCurrencyCode: FiatCurrency.usd,
          accountId: accountGiver.id,
        },
        {
          amount: 22,
          state: WithdrawalState.cancelled,
          currencyId: cryptoKauCurrency.id,
          kauConversion: 5 * 0.1,
          fiatConversion: 0.056,
          fiatCurrencyCode: FiatCurrency.usd,
          accountId: accountGiver.id,
        },
      ]

      await Promise.all(withdrawalParams.map(createWithdrawal))

      const withdrawals: WithdrawalRequest[] = await helper.findNonCancelledWithdrawalsForTheLast24Hours(accountGiver.id)
      expect(withdrawals.length).to.eql(0)
    })

    it('account has 1 completed withdrawals, 1 cancelled and 1 pending. Should return 2 withdrawals', async () => {
      const usdCompletedWithdrawal = await createWithdrawal({
        amount: 5,
        state: WithdrawalState.completed,
        currencyId: fiatUsdCurrency.id,
        kauConversion: 5 * 0.1,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      await createWithdrawal({
        amount: 22,
        state: WithdrawalState.cancelled,
        currencyId: fiatUsdCurrency.id,
        kauConversion: 5 * 0.1,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      const kauPendingWithdrawal = await createWithdrawal({
        amount: 80,
        state: WithdrawalState.pending,
        currencyId: cryptoKauCurrency.id,
        kauConversion: 5 * 0.1,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })

      const withdrawals: WithdrawalRequest[] = (await helper.findNonCancelledWithdrawalsForTheLast24Hours(accountGiver.id)).sort(sortById)

      expect(withdrawals.length).to.eql(2)
      expect(withdrawals[0].amount).to.eql(usdCompletedWithdrawal.amount)
      expect(withdrawals[1].amount).to.eql(kauPendingWithdrawal.amount)
    })
    it('account has 2 completed withdrawals, should return 2 withdrawals', async () => {
      const usdCompletedWithdrawal = await createWithdrawal({
        amount: 5,
        state: WithdrawalState.completed,
        currencyId: fiatUsdCurrency.id,
        kauConversion: 5 * 0.1,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      const kauCompletedWithdrawal = await createWithdrawal({
        amount: 22,
        state: WithdrawalState.completed,
        currencyId: cryptoKauCurrency.id,
        kauConversion: 5 * 0.1,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })

      const withdrawals: WithdrawalRequest[] = (await helper.findNonCancelledWithdrawalsForTheLast24Hours(accountGiver.id)).sort(sortById)
      expect(withdrawals.length).to.eql(2)
      expect(withdrawals[0].amount).to.eql(usdCompletedWithdrawal.amount)
      expect(withdrawals[1].amount).to.eql(kauCompletedWithdrawal.amount)
    })

    it('account has 3 completed withdrawals but 1 outside of time frame, should return 2 withdrawals', async () => {
      const usdCompletedWithdrawal = await createWithdrawal({
        amount: 5,
        state: WithdrawalState.completed,
        currencyId: fiatUsdCurrency.id,
        kauConversion: 5 * 0.1,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      const kauCompletedWithdrawal = await createWithdrawal({
        amount: 22,
        state: WithdrawalState.completed,
        currencyId: cryptoKauCurrency.id,
        kauConversion: 5 * 0.1,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      const kauCompletedWithdrawalTwo = await createWithdrawal({
        amount: 58,
        state: WithdrawalState.completed,
        currencyId: cryptoKauCurrency.id,
        kauConversion: 5 * 0.1,
        fiatConversion: 0.056,
        fiatCurrencyCode: FiatCurrency.usd,
        accountId: accountGiver.id,
      })
      const withdrawals: WithdrawalRequest[] = (await helper.findNonCancelledWithdrawalsForTheLast24Hours(accountGiver.id)).sort(sortById)

      expect(withdrawals.length).to.eql(3)
      expect(withdrawals[0].amount).to.eql(usdCompletedWithdrawal.amount)
      expect(withdrawals[1].amount).to.eql(kauCompletedWithdrawal.amount)
      expect(withdrawals[2].amount).to.eql(kauCompletedWithdrawalTwo.amount)

      await updateDumbWithdrawalRequest({
        ...kauCompletedWithdrawalTwo,
        createdAt: outsideTimeFrameDate,
      })
      const newWithdrawals: WithdrawalRequest[] = await helper.findNonCancelledWithdrawalsForTheLast24Hours(accountGiver.id)
      expect(newWithdrawals.length).to.eql(2)
      expect(newWithdrawals[0].amount).to.eql(usdCompletedWithdrawal.amount)
      expect(newWithdrawals[1].amount).to.eql(kauCompletedWithdrawal.amount)
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
