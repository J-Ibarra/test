import Decimal from 'decimal.js'
import * as util from 'util'

import Web3 from 'web3'
import { EventLog } from 'web3-core'
import Contract from 'web3/eth/contract'
import { Tx } from 'web3/eth/types'
import { Environment } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { decryptValue } from '@abx-utils/encryption'
import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import KinesisVelocityToken from './contracts/KinesisVelocityToken.json'
import { OnChainCurrencyGateway, DepositTransaction, TransactionResponse } from '../../currency_gateway.js'
import { CryptoAddress } from '../../api-provider/model/index.js'

const testMnemonic = 'uncle salute dust cause embody wonder clump blur paddle hotel risk aim'

export const KVT_CONFIG = {
  [Environment.development]: {
    url: 'http://dev-ethereum:8545/',
    networkId: 5777,
    mnemonic: 'insane amazing seminar sniff apology pioneer rib entire vocal north explain wealth',
  },
  [Environment.test]: {
    url: 'http://localhost:7545',
    networkId: 5777,
    mnemonic: testMnemonic,
  },
  [Environment.e2eLocal]: {
    url: `https://ropsten.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`,
  },
  [Environment.e2eAws]: {
    url: `https://ropsten.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`,
  },
  [Environment.integration]: {
    url: `https://ropsten.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`,
  },
  [Environment.uat]: {
    url: `https://ropsten.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`,
  },
  [Environment.production]: {
    url: `https://mainnet.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`,
  },
}

const logger = Logger.getInstance('currencies', 'kvt')

export class KVT implements OnChainCurrencyGateway {
  public contract: Contract
  public ticker: CurrencyCode.kvt
  private web3: Web3
  private decryptedKVTHoldingsSecret: string
  private KVT_GAS_LIMIT: number = 80000

  constructor(env: Environment) {
    this.web3 = new Web3(KVT_CONFIG[env].url)
    const abi = KinesisVelocityToken.abi
    this.ticker = CurrencyCode.kvt

    this.contract = new this.web3.eth.Contract(abi)
    this.contract.options.address = process.env.KVT_CONTRACT_ADDRESS || ''
  }

  set tokenAddress(address: string) {
    this.contract.options.address = address
  }

  get tokenAddress() {
    return this.contract.options.address
  }

  public async generateAddress(): Promise<CryptoAddress> {
    const privateKey = this.generatePrivateKey()
    const publicKey = this.getAddressFromPrivateKey(privateKey)
    return {
      privateKey,
      publicKey,
    }
  }
  public async listenToAddressEvents(_: any): Promise<boolean> {
    logger.debug('Not supported')
    return true
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
   * Get balance from the smart contract
   * @param {string} address
   * @return {promise} - the number of the balance
   */
  public async balanceAt(address: string): Promise<number> {
    const bigBalance = await this.contract.methods.balanceOf(address).call()
    return Number(bigBalance)
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

  public getId() {
    return getCurrencyId(this.ticker)
  }

  public async getHoldingPublicAddress(): Promise<string> {
    const decryptedHoldingsSecret = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!, this.decryptedKVTHoldingsSecret)

    return this.getAddressFromPrivateKey(decryptedHoldingsSecret)
  }

  /**
   * Get the deposit record for the provided address
   * @param address
   * @return {DepositTransaction[]} - Deposit transaction records
   */
  public async getDepositTransactions(address: string): Promise<DepositTransaction[]> {
    logger.debug(`Getting Deposit Transactions for ${this.ticker} at address: ${address}`)
    try {
      const allTransactions = await this.getDepositTransactionsForAccount(address)
      return allTransactions.map(this.apiToDepositTransaction)
    } catch (error) {
      // We swallow this error as not to disrupt the deposits flow
      logger.debug(`Error with getting deposit transactions for currency ${this.ticker}. Message: ${error.message}`)
      return []
    }
  }

  public async getLatestTransactions(): Promise<DepositTransaction[]> {
    throw new Error('Not supported')
  }

  /**
   * Get the balance of  holding account
   * @return {Promise<number>} - the balance
   */
  public async getHoldingBalance(): Promise<number> {
    const decryptedHoldingsSecret = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!, this.decryptedKVTHoldingsSecret)
    const holdingAddress = this.getAddressFromPrivateKey(decryptedHoldingsSecret)
    return this.balanceAt(holdingAddress)
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
   * Transfer KVT to the holding account
   * @param {string} privateKey
   * @param {number} amount
   */
  public async transferToExchangeHoldingsFrom({ privateKey }: CryptoAddress, amount: number) {
    const decryptedHoldingsSecret = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!, this.decryptedKVTHoldingsSecret)
    let potentialGasPrice: number | null = null
    try {
      const { gasPrice } = await this.transferEthForKVTGasFee(privateKey)
      potentialGasPrice = gasPrice
    } catch (error) {
      logger.error(`Error when transfering Ethereum Fee for KVT Deposit`)
      throw error
    }

    const toAddress = this.getAddressFromPrivateKey(decryptedHoldingsSecret)
    return this.transferTo({ privateKey, amount, toAddress, gasPrice: potentialGasPrice })
  }

  /**
   * Transfer KVT form the holding account ot the selected account
   * @param {string} toAddress
   * @param {number} amount
   */
  public async transferFromExchangeHoldingsTo(toAddress: string, amount: number): Promise<TransactionResponse> {
    const holdingPrivateKey = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!, this.decryptedKVTHoldingsSecret)

    return this.transferTo({ amount, privateKey: holdingPrivateKey, toAddress })
  }

  public kinesisManagesConfirmations(): boolean {
    return true
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
      logger.info(`KVT transferTo didnt recieve a gasPrice, calulating new one of: ${gasPrice}`)
    } else {
      logger.info(`KVT transferTo recieved a gasPrice of ${gasPrice}`)
    }

    const sender = this.web3.eth.accounts.privateKeyToAccount(privateKey)

    const transfer = await this.contract.methods.transfer(toAddress, Number(amount))

    const nonce = await this.web3.eth.getTransactionCount(sender.address, 'pending')

    const tx: Tx = {
      to: this.contract.options.address,
      gas: this.KVT_GAS_LIMIT,
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
      logger.error(JSON.stringify(util.inspect(error)))
      throw error
    }
  }

  /**
   * Validate if the string is an address
   * @param {string} address
   */
  public validateAddress(address: string): Promise<boolean> {
    return Promise.resolve(this.web3.utils.isAddress(address))
  }

  public async validateAddressIsNotContractAddress(address: string): Promise<boolean> {
    const addressCode = await this.web3.eth.getCode(address)
    /**
     * 0x0 or 0x is an inconsistence between Ganache and Actual ETH Nodes
     * Ganache will return 0x0 for a non contract address, where
     * Ethereum Nodes will return 0x
     * We can safely test both
     */
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
  public async getDecryptedHoldingsSecret(privateKey: string, currencySecret: string): Promise<string> {
    if (!currencySecret) {
      /**
       * We Prefix the decrypted secret with 0x
       * The Keys generate by EXCO were made in metamask which don't include the 0x when you export the private key
       * They were encrypted with out 0x, so we include it here.
       */
      const prefix = process.env.NODE_ENV === 'test' ? '' : '0x'
      currencySecret = prefix + (await decryptValue(privateKey))
    }

    return currencySecret
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

  private async transferEthForKVTGasFee(privateKey: string) {
    const { utils } = this.web3

    const account = this.web3.eth.accounts.privateKeyToAccount(privateKey)

    const ethBalance = Number(await this.web3.eth.getBalance(account.address))

    const additionalGas = utils.toWei('20', 'Gwei')
    const kvtTransferGasPrice = new Decimal(await this.web3.eth.getGasPrice()).add(additionalGas)
    const amountToSend = kvtTransferGasPrice.times(this.KVT_GAS_LIMIT).toNumber()

    if (ethBalance > amountToSend) {
      logger.warn(`Deposit Address Balance (${ethBalance}) is greater than what we estimate (${amountToSend}) ...skipping gas transfer`)
      return { txHash: null, gasPrice: null }
    }

    const decryptedHoldingsSecret = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!, this.decryptedKVTHoldingsSecret)

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

    logger.info(`Estimated and Transfered ${amountToSend} ETH for KVT transfer`)
    return { txHash: response.transactionHash, gasPrice: kvtTransferGasPrice.toNumber() }
  }
}
