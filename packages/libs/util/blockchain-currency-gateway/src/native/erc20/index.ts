import Web3 from 'web3'
import Contract from 'web3/eth/contract'
import { EventLog } from 'web3-core'

import * as util from 'util'

import { getCurrencyId } from '@abx-service-clients/reference-data'

import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { decryptValue } from '@abx-utils/encryption'

import { OnChainCurrencyGateway, TransactionResponse, DepositTransaction } from '../..'

import Decimal from 'decimal.js'
import { Tx } from 'web3/eth/types'

import { CryptoAddress } from '../../api-provider'

export abstract class ERC20TokenCurrencyGateway implements OnChainCurrencyGateway {
  private logger: Logger
  private web3: Web3
  private contract: Contract
  private ticker: CurrencyCode
  private readonly GAS_LIMIT: number = 80000

  constructor(env: Environment) {
    this.web3 = new Web3(this.getWeb3Config(env))
    this.ticker = this.getCurrencyCode()
    const abi = this.getABI(env)
    this.contract = new this.web3.eth.Contract(abi)
    this.contract.options.address = this.getContractAddress(env)

    this.logger = Logger.getInstance('blockchain-currency-gateway', `ERC20TokenCurrencyGateway ${this.ticker.toLocaleLowerCase()}`)
  }

  abstract getWeb3Config(env: Environment): any
  abstract getCurrencyCode(): CurrencyCode
  abstract getContractAddress(env: Environment): string
  abstract getABI(env: Environment): any

  public async generateAddress(): Promise<CryptoAddress> {
    const privateKey = this.generatePrivateKey()
    const publicKey = this.getAddressFromPrivateKey(privateKey)
    return {
      privateKey,
      publicKey,
    }
  }

  /**
   * Generate a private key
   * @return {string} - private key
   */
  private generatePrivateKey(): string {
    const { privateKey } = this.web3.eth.accounts.create()
    return privateKey
  }

  /**
   * Get the address from the given private key
   * @param {string} privateKey - Should start with '0x' and followed by 64bit
   * @return {string} - Account address
   */
  private getAddressFromPrivateKey(privateKey: string): string {
    if (privateKey.slice(0, 2) !== '0x' && privateKey.length !== 66) {
      throw new Error('Invalid private key')
    }
    return this.web3.eth.accounts.privateKeyToAccount(privateKey).address
  }

  /**
   * Get balance from the smart contract
   * @param {string} address
   * @return {promise} - the number of the balance
   */
  public async balanceAt(address: string): Promise<number> {
    const bigBalance = await this.contract.methods.balanceOf(address).call()
    return Number(bigBalance)
  }

  public getId() {
    return getCurrencyId(this.ticker)
  }

  public async getLatestTransactions(): Promise<DepositTransaction[]> {
    throw new Error('Not supported')
  }

  addressEventListener(): Promise<IAddressTransaction> {
    throw new Error('Not supported')
  }

  public async getHoldingPublicAddress(): Promise<string> {
    throw new Error('Not supported')
  }

  public async getHoldingBalance(): Promise<number> {
    throw new Error('Not supported')
  }

  public async transferToExchangeHoldingsFrom(
    { privateKey }: CryptoAddress | Pick<CryptoAddress, 'privateKey'>,
    amount: number,
  ): Promise<TransactionResponse> {
    const decryptedHoldingsSecret = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!, this.decryptedKVTHoldingsSecret)
    let potentialGasPrice: number | null = null
    try {
      const { gasPrice } = await this.transferEthForKVTGasFee(privateKey)
      potentialGasPrice = gasPrice
    } catch (error) {
      this.logger.error(`Error when transfering Ethereum Fee for KVT Deposit`)
      throw error
    }

    const toAddress = this.getAddressFromPrivateKey(decryptedHoldingsSecret)
    return this.transferTo({ privateKey, amount, toAddress, gasPrice: potentialGasPrice })
  }

  public async transferFromExchangeHoldingsTo(_toAddress: string, _amount: number): Promise<TransactionResponse> {
    throw new Error('Not supported')
  }

  /**
   * Transfer amount of token from one account (using private key) to another account (using address)
   * @param {string} privateKey - Private key of funded account
   * @param {number} amount - Number of token to transfer
   * @param {string} toAddress - receiver account address
   * @return {object} - An object contain transaction hash
   */
  public async transferTo({
    privateKey,
    amount,
    toAddress,
    gasPrice,
  }: {
    privateKey: string
    amount: number
    toAddress: string
    gasPrice?: number | null
  }): Promise<TransactionResponse> {
    const { utils } = this.web3

    if (!gasPrice) {
      const gasPriceFromNode = await this.web3.eth.getGasPrice()
      const additionalGas = utils.toWei('20', 'Gwei').toString()
      gasPrice = new Decimal(gasPriceFromNode).add(additionalGas).toNumber()
      this.logger.info(`${this.ticker} transferTo didnt recieve a gasPrice, calulating new one of: ${gasPrice}`)
    } else {
      this.logger.info(`${this.ticker} transferTo recieved a gasPrice of ${gasPrice}`)
    }

    const sender = this.web3.eth.accounts.privateKeyToAccount(privateKey)
    const transfer = await this.contract.methods.transfer(toAddress, Number(amount))
    const nonce = await this.web3.eth.getTransactionCount(sender.address, 'pending')

    const tx: Tx = {
      to: this.contract.options.address,
      gas: this.GAS_LIMIT,
      gasPrice,
      value: 0x0,
      data: transfer.encodeABI(),
      nonce,
    }

    try {
      const signedTx = await this.web3.eth.accounts.signTransaction(tx, sender.privateKey)
      const response = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
      const transactionGasPrice = new Decimal(tx.gasPrice || 0)
      const fee = this.web3.utils.fromWei(transactionGasPrice.times(response.gasUsed).toString(), 'ether')
      return { txHash: response.transactionHash, transactionFee: fee.toString() }
    } catch (error) {
      this.logger.error(JSON.stringify(util.inspect(error)))
      throw error
    }
  }

  /**
   * Check the confirmation of the transaction
   * @param {string} txHash - transaction hash
   * @return {boolean} - true, if the transaction is confirmed
   */
  public async checkConfirmationOfTransaction(txHash: string) {
    const receipt = await this.web3.eth.getTransactionReceipt(txHash)
    const currentBlockHeight = await this.web3.eth.getBlockNumber()
    return currentBlockHeight - receipt.blockNumber >= 5
  }

  /**
   * Validate if the string is an address
   * @param {string} address
   */
  public validateAddress(address: string): Promise<boolean> {
    return Promise.resolve(this.web3.utils.isAddress(address))
  }

  /**
   * 0x0 or 0x is an inconsistence between Ganache and Actual ETH Nodes
   * Ganache will return 0x0 for a non contract address, where
   * Ethereum Nodes will return 0x
   * We can safely test both
   */
  public async validateAddressIsNotContractAddress(address: string): Promise<boolean> {
    const addressCode = await this.web3.eth.getCode(address)

    if (addressCode === '0x' || addressCode === '0x0') {
      return true
    }
    return false
  }

  /**
   * Decrypt CMK-encrypted holdings secrets
   * @param {string} privateKey - the private key to decrypt
   * @param {string} currencySecret - the private variable of currency the secret is decrypted of
   */
  public async getDecryptedHoldingsSecret(privateKey: string): Promise<string> {
    /**
     * We Prefix the decrypted secret with 0x
     * The Keys generate by EXCO were made in metamask which don't include the 0x when you export the private key
     * They were encrypted with out 0x, so we include it here.
     */
    const prefix = process.env.NODE_ENV === 'test' ? '' : '0x'
    const currencySecret = prefix + (await decryptValue(privateKey))

    return currencySecret
  }
  /**
   * Get the deposit record for the provided address
   * @param address
   * @return {DepositTransaction[]} - Deposit transaction records
   */
  public async getDepositTransactions(address: string): Promise<DepositTransaction[]> {
    this.logger.debug(`Getting Deposit Transactions for ${this.ticker} at address: ${address}`)

    try {
      const allTransactions = await this.getDepositTransactionsForAccount(address)
      return allTransactions.map(this.apiToDepositTransaction)
    } catch (error) {
      this.logger.debug(`Error with getting deposit transactions for currency ${this.ticker}. Message: ${error.message}`)
      return []
    }
  }

  /**
   * Get all Transfer Event from contract that transfer token into address
   * @param {string} address - deposit account
   * @return {promise} - All deposit event related to the address
   */
  private getDepositTransactionsForAccount(address: string): Promise<EventLog[]> {
    return this.contract.getPastEvents('Transfer', {
      filter: {
        to: address,
      },
      fromBlock: 0,
    })
  }

  /**
   * Convert EventLog to DepositTransaction
   * @param {EventLog} event - EventLog return from contract
   */
  private apiToDepositTransaction = (event: EventLog): DepositTransaction => {
    return {
      from: event.returnValues.from,
      txHash: event.transactionHash,
      amount: Number(event.returnValues.value),
    }
  }

  private async transferEthForTokenGasFee(privateKey: string) {
    const { utils } = this.web3
    const additionalGas = utils.toWei('20', 'Gwei')
    const accountHasSufficientBalanceToCoverEthGasFee = this.accountHasSufficientBalanceToCoverEthGasFee(privateKey)

    if (accountHasSufficientBalanceToCoverEthGasFee) {
      this.logger.warn(
        `Deposit Address ETH Balance (${ethBalance}) is greater than what we estimate (${amountToSend}) ...skipping 'Kinesis->Deposit Address' gas transfer`,
      )
      return { txHash: null, gasPrice: null }
    }

    const decryptedHoldingsSecret = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!)
    const holdingsAccount = await this.web3.eth.accounts.privateKeyToAccount(decryptedHoldingsSecret)
    const nonce = await this.web3.eth.getTransactionCount(holdingsAccount.address, 'pending')

    const gasPriceFromNode = await this.web3.eth.getGasPrice()
    const gasPrice = new Decimal(gasPriceFromNode).add(additionalGas).toString()

    const transaction = await this.web3.eth.accounts.privateKeyToAccount(decryptedHoldingsSecret).signTransaction({
      to: account.address,
      value: amountToSend.toString(),
      gas: 21000,
      gasPrice,
      nonce,
    })

    const response = await this.web3.eth.sendSignedTransaction(transaction.rawTransaction)

    this.logger.info(`Estimated and Transfered ${amountToSend} ETH for ${this.getCurrencyCode()} transfer`)
    return { txHash: response.transactionHash, gasPrice: kvtTransferGasPrice.toNumber() }
  }

  private async accountHasSufficientBalanceToCoverEthGasFee(privateKey: string) {
    const { utils } = this.web3
    const account = this.web3.eth.accounts.privateKeyToAccount(privateKey)
    const ethBalance = Number(await this.web3.eth.getBalance(account.address))

    const additionalGas = utils.toWei('20', 'Gwei')
    const contractTransferGasPrice = new Decimal(await this.web3.eth.getGasPrice()).add(additionalGas)
    const amountToSend = contractTransferGasPrice.times(this.GAS_LIMIT).toNumber()

    return ethBalance > amountToSend
  }

  private async transferEthForGasFee() {
    const decryptedHoldingsSecret = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!)
    const holdingsAccount = await this.web3.eth.accounts.privateKeyToAccount(decryptedHoldingsSecret)
    const nonce = await this.web3.eth.getTransactionCount(holdingsAccount.address, 'pending')

    const gasPriceFromNode = await this.web3.eth.getGasPrice()
    const gasPrice = new Decimal(gasPriceFromNode).add(additionalGas).toString()

    const transaction = await this.web3.eth.accounts.privateKeyToAccount(decryptedHoldingsSecret).signTransaction({
      to: account.address,
      value: amountToSend.toString(),
      gas: 21000,
      gasPrice,
      nonce,
    })

    const response = await this.web3.eth.sendSignedTransaction(transaction.rawTransaction)

    this.logger.info(`Estimated and Transfered ${amountToSend} ETH for ${this.getCurrencyCode()} transfer`)
    return { txHash: response.transactionHash, gasPrice: kvtTransferGasPrice.toNumber() }
  }
}
