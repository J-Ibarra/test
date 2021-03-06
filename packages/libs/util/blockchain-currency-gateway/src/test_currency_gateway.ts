import { CurrencyManager } from './currency_manager'
import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { DepositTransaction, OnChainCurrencyGateway, ExchangeHoldingsTransfer } from './currency_gateway'
import { CryptoAddress } from './model'

export const TEST_CURRENCY_TICKER = 'TST' as CurrencyCode
export const TEST_CURRENCY_ID = 1

export class TestCurrencyManager extends CurrencyManager {
  public getCurrencyFromTicker(ticker) {
    const currency = CurrencyManager.currencies[ticker]
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
    return CurrencyManager.currencies[TEST_CURRENCY_TICKER] as TestCurrency
  }

  public validateAddress() {
    return true
  }

  protected setupCurrencies(_, currencies: CurrencyCode[]) {
    CurrencyManager.currencies = {
      [TEST_CURRENCY_TICKER as CurrencyCode]: new TestCurrency(),
    } as any

    currencies.forEach((currency) => (CurrencyManager.currencies[currency] = new TestCurrency() as any))
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

  public subscribeToTransactionConfirmationEvents(_transactionHash: string) {
    return Promise.resolve()
  }

  getTransaction(_transactionHash: string, _targetAddress: string) {
    return null as any
  }

  public async transferFromExchangeHoldingsTo({ toAddress }: ExchangeHoldingsTransfer) {
    return this.transferTo(toAddress)
  }

  kinesisManagesConfirmations() {
    return true
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

  public async createAddressTransactionSubscription(): Promise<boolean> {
    return true
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

  public async validateAddressIsNotContractAddress(): Promise<boolean> {
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
    return this.transactions.filter((t) => t.address === address)
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
