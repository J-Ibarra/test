import { Decimal } from 'decimal.js'
import sinon from 'sinon'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { truncateTables } from '@abx/db-connection-utils'
import * as realTimeMidPriceCalculationOperations from '@abx-service-clients/market-data'
import * as fxRateProvider from '@abx-utils/fx-rate'
import { WithdrawalState, WithdrawalRequestType, WithdrawalCancelParams, WithdrawalConfirmParams } from '@abx-types/withdrawal'
import { createWithdrawalRequest, cancelFiatWithdrawal } from '../lib'
import { validatePartialMatch, USD, stubAccountCreation, KAU } from './utils'
import * as accountOperations from '@abx-service-clients/account'
import { expect } from 'chai'

import { FiatCurrency } from '@abx-types/reference-data'

describe('Withdrawal Request Cancellation', () => {
  const sandbox = sinon.createSandbox()
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
      .resolves(USD)

    sandbox.stub(realTimeMidPriceCalculationOperations, 'calculateRealTimeMidPriceForSymbol').resolves(depthMidPrice)
    sandbox.stub(fxRateProvider, 'getQuoteFor').resolves(fxQuote)
    sinon.stub(accountOperations, 'findOrCreateKinesisRevenueAccount').resolves(kinesisRevenueAccount)

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

  describe('cancelFiatWithdrawal', () => {
    it('updates fiat withdrawal state to cancelled', async () => {
      const address = 'test-address'
      const amount = 1.5
      const account = await stubAccountCreation()

      const withdrawalRequest = await createWithdrawalRequest({
        accountId: account.id,
        address,
        amount,
        currencyId: USD.id,
        state: WithdrawalState.pending,
        fiatCurrencyCode: FiatCurrency.usd,
        fiatConversion: 0,
        kauConversion: 0,
        type: WithdrawalRequestType.withdrawal,
      })
      const withdrawalCancelParams: WithdrawalCancelParams = {
        id: withdrawalRequest!.id!,
      }

      sinon.stub(referenceDataOperations, 'findCurrencyForId').resolves(USD)
      const cancelledWithdrawal = await cancelFiatWithdrawal(withdrawalCancelParams)

      validatePartialMatch(
        {
          accountId: account.id,
          amount,
          address,
          currencyId: USD.id,
          state: WithdrawalState.cancelled,
        },
        cancelledWithdrawal,
      )
    })

    it('throws error if withdrawal request does not exist', async () => {
      const id = 1
      const withdrawalConfirmParams: WithdrawalConfirmParams = {
        id,
      }

      try {
        await cancelFiatWithdrawal(withdrawalConfirmParams)

        throw new Error(`Incorrect error thrown`)
      } catch ({ message }) {
        expect(message).to.equal(`No withdrawal request exists with id ${id}`)
      }
    })

    it('throws error if withdrawal currency is not flat', async () => {
      const account = await stubAccountCreation()
      sinon.stub(referenceDataOperations, 'findCurrencyForId').resolves(KAU)

      const withdrawalRequest = await createWithdrawalRequest({
        accountId: account.id,
        address: 'test-address',
        amount: 1,
        currencyId: KAU.id,
        state: WithdrawalState.pending,
        fiatCurrencyCode: FiatCurrency.usd,
        fiatConversion: 0,
        kauConversion: 0,
        type: WithdrawalRequestType.withdrawal,
      })

      const withdrawalConfirmParams: WithdrawalConfirmParams = {
        id: withdrawalRequest!.id!,
      }

      try {
        await cancelFiatWithdrawal(withdrawalConfirmParams)

        throw new Error(`Incorrect error thrown`)
      } catch ({ message }) {
        expect(message).to.equal(`Only fiat withdrawals can be cancelled`)
      }
    })

    it('throws error if withdrawal request is not in pending state', async () => {
      const account = await stubAccountCreation()
      sinon.stub(referenceDataOperations, 'findCurrencyForId').resolves(USD)

      const withdrawalRequest = await createWithdrawalRequest({
        accountId: account.id,
        address: 'test-address',
        amount: 1,
        currencyId: USD.id,
        state: WithdrawalState.completed,
        fiatCurrencyCode: FiatCurrency.usd,
        fiatConversion: 0,
        kauConversion: 0,
        type: WithdrawalRequestType.withdrawal,
      })

      const withdrawalCancelParams: WithdrawalConfirmParams = {
        id: withdrawalRequest!.id!,
      }

      try {
        await cancelFiatWithdrawal(withdrawalCancelParams)

        throw new Error(`Incorrect error thrown`)
      } catch ({ message }) {
        expect(message).to.equal(`Withdrawal request with id ${withdrawalRequest!.id} is in completed state and cannot be cancelled`)
      }
    })
  })
})
