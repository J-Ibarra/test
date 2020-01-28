import { expect } from 'chai'
import sinon from 'sinon'
import { Environment } from '@abx-types/reference-data'
import { Account } from '@abx-types/account'
import { BalanceTypeObj } from '@abx-types/balance'
import * as boundaryOperations from '@abx-service-clients/reference-data'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { Currency, CurrencyCode } from '@abx-types/reference-data'
import * as helper from '../../lib'
import { createAccountsAndWithdrawalFunctions } from '../initialisation_helper'

let accountGiver: Account
let cryptoKauCurrency: Currency = {
  id: 2,
  code: CurrencyCode.kau,
}
let cryptoEthCurrency: Currency = {
  id: 3,
  code: CurrencyCode.ethereum,
}

const manager = new CurrencyManager(Environment.test, [CurrencyCode.kau, CurrencyCode.ethereum])

describe('crypto_validators', async () => {
  const sandbox = sinon.createSandbox()
  let kauCryptoBalance: BalanceTypeObj
  let ethCryptoBalance: BalanceTypeObj
  const kagCurrency = {
    id: 1,
    code: CurrencyCode.kag,
  }

  after(async () => {
    sandbox.restore()
    sinon.restore()
  })

  beforeEach(async () => {
    sinon.stub(boundaryOperations, 'findBoundaryForCurrency').resolves({
      id: 1,
      minAmount: 10,
      maxDecimals: 4,
      currencyCode: CurrencyCode.usd,
    })
    sinon.stub(boundaryOperations, 'truncateCurrencyValue').callsFake(({ value }) => `${value}`)
    sinon.stub(boundaryOperations, 'validateValueWithinBoundary').returns({ valid: true, expects: '' })
    sinon.stub(boundaryOperations, 'getWithdrawalLimit').returns(1000000)

    const { accountOne, kauCurrency, kauBalance, ethCurrency, ethBalance } = await createAccountsAndWithdrawalFunctions()

    accountGiver = accountOne
    cryptoKauCurrency = kauCurrency
    cryptoEthCurrency = ethCurrency
    kauCryptoBalance = { id: kauBalance.id, value: 100 }
    ethCryptoBalance = { id: ethBalance.id, value: 100 }
  })

  afterEach(() => sinon.restore())

  it('crypto address not valid. Should return validation error', async () => {
    let response
    manager.getCurrencyFromTicker(CurrencyCode.kau).validateAddress = sandbox.stub().returns(false)

    try {
      response = await helper.validateWithdrawal({
        currency: cryptoKauCurrency,
        currencyCode: cryptoKauCurrency.code,
        amount: kauCryptoBalance.value! - 30,
        availableBalance: kauCryptoBalance,
        account: accountGiver,
        manager,
        address: '4324',
        feeCurrency: cryptoKauCurrency,
        feeCurrencyAvailableBalance: kauCryptoBalance,
        feeAmount: 10,
      })
    } catch (e) {
      response = e.message
    }
    expect(response).to.eql(`${cryptoKauCurrency.code} address (${'4324'}) is not valid`)
  })

  it('crypto contract address not valid. Should return validation error', async () => {
    let response
    manager.getCurrencyFromTicker(CurrencyCode.ethereum).validateAddress = sandbox.stub().returns(true)
    manager.getCurrencyFromTicker(CurrencyCode.ethereum).validateAddressIsNotContractAddress = sandbox.stub().returns(false)

    try {
      response = await helper.validateWithdrawal({
        currency: cryptoEthCurrency,
        currencyCode: cryptoEthCurrency.code,
        amount: ethCryptoBalance.value! - 30,
        availableBalance: ethCryptoBalance,
        account: accountGiver,
        manager,
        address: '0xContractAddress',
        feeCurrency: cryptoEthCurrency,
        feeCurrencyAvailableBalance: ethCryptoBalance,
        feeAmount: 10,
      })
    } catch (e) {
      response = e.message
    }
    expect(response).to.eql(
      `The ETH address you provided is a contract address. At this point we are unable to withdraw your ETH to a contract address. Please submit your request with a different ETH address`,
    )
  })

  it('fee currency same as withdrawn currency, available balance not enough to cover both fee and withdrawal amount . Should return validation error', async () => {
    let response
    manager.getCurrencyFromTicker(CurrencyCode.kau).validateAddress = sandbox.stub().returns(true)
    const amount = kauCryptoBalance.value! - 5

    try {
      response = await helper.validateWithdrawal({
        currency: cryptoKauCurrency,
        currencyCode: cryptoKauCurrency.code,
        amount,
        availableBalance: kauCryptoBalance,
        account: accountGiver,
        manager,
        address: '4324',
        feeCurrency: cryptoKauCurrency,
        feeCurrencyAvailableBalance: kauCryptoBalance,
        feeAmount: 10,
      })
    } catch (e) {
      response = e.message
    }
    expect(response).to.eql(`Withdrawal request amount ${cryptoKauCurrency.code}${amount} is greater than available balance`)
  })

  it('fee currency balance not enough to cover balance. Should return validation error', async () => {
    let response
    manager.getCurrencyFromTicker(CurrencyCode.kau).validateAddress = sandbox.stub().returns(true)

    const feeAmount = 10

    try {
      response = await helper.validateWithdrawal({
        currency: cryptoKauCurrency,
        currencyCode: cryptoKauCurrency.code,
        amount: kauCryptoBalance.value! - 10,
        availableBalance: kauCryptoBalance,
        account: accountGiver,
        manager,
        address: '4324',
        feeCurrency: kagCurrency,
        feeCurrencyAvailableBalance: { id: 2, value: 0 },
        feeAmount,
      })
    } catch (e) {
      response = e.message
    }

    expect(response).to.eql(`Withdrawal request fee amount ${kagCurrency.code} ${feeAmount} is greater than available balance`)
  })
})
