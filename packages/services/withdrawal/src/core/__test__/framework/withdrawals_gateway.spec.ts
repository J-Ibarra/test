import { expect } from 'chai'
import sinon from 'sinon'
import { getEnvironment } from '@abx-types/reference-data'
import * as accountOperations from '@abx-service-clients/account'
import * as balanceOperations from '@abx-service-clients/balance'
import { CurrencyManager } from '@abx-query-libs/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { CryptoWithdrawalGatekeeper, initialiseWithdrawal } from '../../framework'
import * as requestHandlers from '../../framework/request-handlers'
import * as withdrawalOperations from '../../lib'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

describe('withdrawals_gateway', () => {
  const accountId = 'acc1'
  const withdrawalAmount = 10
  const account = {
    id: accountId,
    users: [
      {
        id: 'userId',
      },
    ],
  } as any
  const balance = {
    available: { id: 1, value: 100 },
  } as any

  const currencyManager = new CurrencyManager(getEnvironment(), [CurrencyCode.kau])
  const pendingHoldingsAccountTransferGatekeeper = new CryptoWithdrawalGatekeeper('foo')
  const feeAmount = 12

  beforeEach(() => {
    sinon.stub(accountOperations, 'findAccountsByIdWithUserDetails').resolves(account)
    sinon.stub(balanceOperations, 'findBalance').resolves(balance)
  })

  afterEach(() => sinon.restore())

  it('initialiseWithdrawal should use fiat handler when currency is fiat', async () => {
    const withdrawalParams = {
      accountId,
      amount: withdrawalAmount,
      currencyCode: CurrencyCode.usd,
      memo: 'foo',
    }
    const currency = { code: CurrencyCode.usd, id: 1, sortPriority: 1, orderPriority: 5 }

    sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({ feeAmount, feeCurrency: CurrencyCode.usd })
    sinon.stub(referenceDataOperations, 'findCurrencyForCodes').resolves([currency, currency])
    sinon.stub(balanceOperations, 'findCurrencyBalances').resolves([{ available: balance.available }, { available: balance.available }])
    const handleFiatCurrencyWithdrawalRequestStub = sinon.stub(requestHandlers, 'handleFiatCurrencyWithdrawalRequest')
    const validateWithdrawalStub = sinon.stub(withdrawalOperations, 'validateWithdrawal').resolves()

    await initialiseWithdrawal(withdrawalParams, pendingHoldingsAccountTransferGatekeeper)

    expect(handleFiatCurrencyWithdrawalRequestStub.calledWith({ params: withdrawalParams, currency })).to.eql(true)
    const args = validateWithdrawalStub.getCall(0).args[0]

    expect(args.currency).to.eql(currency)
    expect(args.currencyCode).to.eql(currency.code)
    expect(args.amount).to.eql(withdrawalAmount)
    expect(args.availableBalance).to.eql(balance.available)
    expect(args.account).to.eql(account)
    expect(args.memo).to.eql(withdrawalParams.memo)
    expect(args.feeCurrency).to.eql(currency)
    expect(args.feeCurrencyAvailableBalance).to.eql(balance.available)
    expect(args.feeAmount).to.eql(feeAmount)
  })

  it('initialiseWithdrawal should use crypto handler when currency is crypto', async () => {
    const withdrawalParams = {
      accountId,
      amount: withdrawalAmount,
      currencyCode: CurrencyCode.kau,
      memo: 'foo',
      address: 'addresss',
    }
    const currency = { code: CurrencyCode.kau, id: 1, sortPriority: 2, orderPriority: 1 }

    const kauOnchainCurrencyGateway = currencyManager.getCurrencyFromTicker(CurrencyCode.kau)

    sinon.stub(referenceDataOperations, 'getWithdrawalConfigForCurrency').resolves({ feeAmount, feeCurrency: CurrencyCode.kau })
    sinon.stub(referenceDataOperations, 'findCurrencyForCodes').resolves([currency, currency])
    sinon.stub(balanceOperations, 'findCurrencyBalances').resolves([{ available: balance.available }, { available: balance.available }])
    const handleCryptoCurrencyWithdrawalRequest = sinon.stub(requestHandlers, 'handleCryptoCurrencyWithdrawalRequest')
    const validateWithdrawalStub = sinon.stub(withdrawalOperations, 'validateWithdrawal').resolves()

    await initialiseWithdrawal(withdrawalParams, pendingHoldingsAccountTransferGatekeeper)

    const args = validateWithdrawalStub.getCall(0).args[0]

    expect(args.currency).to.eql(currency)
    expect(args.currencyCode).to.eql(currency.code)
    expect(args.amount).to.eql(withdrawalAmount)
    expect(args.availableBalance).to.eql(balance.available)
    expect(args.account).to.eql(account)
    expect(args.memo).to.eql(withdrawalParams.memo)
    expect(args.feeCurrency).to.eql(currency)
    expect(args.feeCurrencyAvailableBalance).to.eql(balance.available)
    expect(args.feeAmount).to.eql(feeAmount)

    expect(
      handleCryptoCurrencyWithdrawalRequest.calledWith(
        withdrawalParams,
        currency,
        currency,
        kauOnchainCurrencyGateway,
        pendingHoldingsAccountTransferGatekeeper,
      ),
    ).to.eql(true)
  })
})
