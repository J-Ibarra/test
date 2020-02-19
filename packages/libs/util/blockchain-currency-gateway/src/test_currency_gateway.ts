import { CurrencyManager } from './currency_manager'
import { Environment } from '@abx-types/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { DepositTransaction, OnChainCurrencyGateway } from './currency_gateway'
import { CryptoAddress } from './api-provider/model'

export const TEST_CURRENCY_TICKER = 'TST' as CurrencyCode
export const TEST_CURRENCY_ID = 1

export class TestCurrencyManager extends CurrencyManager {
  constructor(currencies: CurrencyCode[] = []) {
    super(Environment.test)
    this.setupCurrencies(Environment.test, currencies)
  }

  public getCurrencyFromTicker(ticker) {
    const currency = this.currencies[ticker]
    if (!currency) {
      throw new Error(`Currency ${ticker} is not implemented`)
    }
    return currency
  }

  // _id
  public async getCurrencyFromId() {
    return this.getCurrencyFromTicker(TEST_CURRENCY_TICKER)
  }

  public setBalanceAtAddress(address: string, amount: number) {
    this.getTestCurrency().setBalanceAtAddress(address, amount)
  }

  public setAddressOfPrivateKey(privateKey: string, address: string) {
    this.getTestCurrency().setAddressOfPrivateKey(privateKey, address)
  }

  public getTestCurrency() {
    return this.currencies[TEST_CURRENCY_TICKER] as TestCurrency
  }

  public validateAddress() {
    return true
  }

  protected setupCurrencies(_, currencies: CurrencyCode[]) {
    this.currencies = {
      [TEST_CURRENCY_TICKER as CurrencyCode]: new TestCurrency(),
    } as any

    currencies.forEach(currency => (this.currencies[currency] = new TestCurrency() as any))
  }
}

interface TestDepositTransaction extends DepositTransaction {
  address: string
}

export class TestCurrency implements OnChainCurrencyGateway {
  public ticker = TEST_CURRENCY_TICKER as CurrencyCode
  private addresses: { [key: string]: string }
  private balances: { [key: string]: number }
  private transactions: TestDepositTransaction[]
  private addressCounter: number

  constructor() {
    this.addressCounter = 0
    this.balances = {}
    this.addresses = {}
    this.transactions = []
  }

  public async getId() {
    return getCurrencyId(TEST_CURRENCY_TICKER)
  }

  public async balanceAt(address: string) {
    return this.balances[address]
  }

  public async transferFromExchangeHoldingsTo(address: string) {
    return this.transferTo(address)
  }

  public async transferTo(_) {
    return { txHash: 'test-transaction-hash' }
  }

  public async generateAddress(): Promise<CryptoAddress> {
    const privateKey = this.generatePrivateKey()
    const publicKey = this.getAddressFromPrivateKey(privateKey)
    return {
      privateKey,
      publicKey,
    }
  }

  private generatePrivateKey() {
    const newPrivate = `private${this.addressCounter}`
    const newAddress = `address${this.addressCounter}`
    this.addresses[newPrivate] = newAddress
    this.addressCounter += 1
    return newPrivate
  }

  private getAddressFromPrivateKey(privateKey: string) {
    return this.addresses[privateKey]
  }

  public async getHoldingBalance() {
    return 50
  }

  public async getHoldingPublicAddress() {
    return Promise.resolve('publicAddress')
  }
  public validateAddress(address: string) {
    return Promise.resolve(!!address && !address.includes('invalid'))
  }

  public async validateAddressIsNotContractAddress(_: string): Promise<boolean> {
    return true
  }

  public setBalanceAtAddress(address: string, amount: number) {
    this.balances[address] = amount
  }

  public setAddressOfPrivateKey(privateKey: string, address: string) {
    this.addresses[privateKey] = address
  }

  public async checkConfirmationOfTransaction(txHash: string, isConfirmed = true) {
    return !txHash.includes('unconfirmed') && isConfirmed
  }

  public async getDepositTransactions(address: string) {
    return this.transactions.filter(t => t.address === address)
  }

  public async getLatestTransactions() {
    return this.transactions
  }

  public setDepositTransactions(dep: TestDepositTransaction) {
    this.transactions.push(dep)
  }

  public transferToExchangeHoldingsFrom() {
    return Promise.resolve({
      txHash: 'hash',
      transactionFee: '12',
    })
  }

  public getDecryptedHoldingsSecret() {
    return Promise.resolve('decrypted key')
  }

  public transferFromExchangeHoldingsToEmissionsAccount() {
    return Promise.resolve()
  }
}
