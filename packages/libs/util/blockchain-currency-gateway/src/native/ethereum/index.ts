import Decimal from 'decimal.js'
import Web3 from 'web3'
import { Transaction } from 'web3/eth/types'
import { getEthereumDepositMaxBlockCheck } from '@abx-service-clients/reference-data'
import { Logger } from '@abx-utils/logging'
import { decryptValue } from '@abx-utils/encryption'
import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { getEthScanTransactionsForAddress } from './etherscan/etherscan'
import { EtherscanInternalTransaction, EtherscanTransaction, EthscanTransactionType } from './etherscan/interface'
import { OnChainCurrencyGateway, DepositTransaction, TransactionResponse } from '../../currency_gateway'
import { CryptoAddress } from '../../api-provider/model'
import { IAddressTransaction } from '../../api-provider/providers/crypto-apis'
import { RuntimeError } from '@abx-types/error'

const testMnemonic = 'uncle salute dust cause embody wonder clump blur paddle hotel risk aim'

export const ETH_CONFIG = {
  [Environment.development]: {
    url: 'http://dev-ethereum:8545',
    networkId: 5777,
    mnemonic: 'insane amazing seminar sniff apology pioneer rib entire vocal north explain wealth',
  },
  [Environment.test]: {
    url: 'http://localhost:7545',
    networkId: 5777,
    mnemonic: testMnemonic,
  },
  [Environment.e2eLocal]: {
    url: `https://ropsten.infura.io/v3/${process.env.KBE_INFURA_PROJECT_ID}`,
  },
  [Environment.e2eAws]: {
    url: `https://ropsten.infura.io/v3/${process.env.KBE_INFURA_PROJECT_ID}`,
  },
  [Environment.integration]: {
    url: `https://ropsten.infura.io/v3/${process.env.KBE_INFURA_PROJECT_ID}`,
  },
  [Environment.uat]: {
    url: `https://ropsten.infura.io/v3/${process.env.KBE_INFURA_PROJECT_ID}`,
  },
  [Environment.production]: {
    url: `https://mainnet.infura.io/v3/${process.env.KBE_INFURA_PROJECT_ID}`,
  },
}

const logger = Logger.getInstance('currencies', 'ethereum')

export class Ethereum implements OnChainCurrencyGateway {
  public ticker = CurrencyCode.ethereum
  private web3: Web3
  private decryptedHoldingsSecret: string
  private static readonly BLOCKS_TO_GO_BACK_FOR_CONFIRMATION = 10

  constructor(env: Environment) {
    this.web3 = new Web3(ETH_CONFIG[env].url)
  }

  public async generateAddress(): Promise<CryptoAddress> {
    const privateKey = this.generatePrivateKey()
    const publicKey = this.getAddressFromPrivateKey(privateKey)
    return {
      privateKey,
      publicKey,
    }
  }

  addressEventListener(): Promise<IAddressTransaction> {
    throw new RuntimeError('Unsupported operation addressEventListener')
  }

  private generatePrivateKey() {
    const { privateKey } = this.web3.eth.accounts.create()
    return privateKey
  }

  public async balanceAt(address: string) {
    const bigBalance = await this.web3.eth.getBalance(address)
    return Number(this.web3.utils.fromWei(bigBalance))
  }

  private getAddressFromPrivateKey(privateKey: string) {
    if (privateKey.slice(0, 2) !== '0x' && privateKey.length !== 66) {
      throw new Error('Invalid private key')
    }
    return this.web3.eth.accounts.privateKeyToAccount(privateKey).address
  }

  public getId() {
    return getCurrencyId(this.ticker)
  }

  public async getDepositTransactions(address: string, recordedTransactionHashesForAddress: string[]): Promise<DepositTransaction[]> {
    logger.debug(`Getting Deposit Transactions for ${this.ticker} at address: ${address}`)
    try {
      const transactions = await this.getDepositTransactionsForAccount(address, recordedTransactionHashesForAddress)

      return transactions.map(this.apiToDepositTransaction)
    } catch (error) {
      // We swallow this error as not to disrupt the deposits flow
      logger.debug(`Error with getting deposit transactions for currency ${this.ticker}. Message: ${error.message}`)
      return []
    }
  }

  public async getLatestTransactions(recordedTransactionHashesForAddress: string[]): Promise<DepositTransaction[]> {
    logger.debug(`Getting Latest Transactions for ${this.ticker}`)
    try {
      const transactions = await this.getTransactionsFromBlocks(recordedTransactionHashesForAddress)
      return transactions.map(this.apiToDepositTransaction)
    } catch (error) {
      logger.debug(`Error with getting latest transactions for currency ${this.ticker}. Message: ${error.message}`)

      throw error
    }
  }

  public async getHoldingBalance() {
    const holdingAddress = await this.getHoldingPublicAddress()
    return this.balanceAt(holdingAddress)
  }

  public async getHoldingPublicAddress(): Promise<string> {
    const decryptedPrivateKey = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!, this.decryptedHoldingsSecret)

    return this.getAddressFromPrivateKey(decryptedPrivateKey)
  }

  public async checkConfirmationOfTransaction(txHash: string) {
    const receipt = await this.web3.eth.getTransactionReceipt(txHash)
    const currentBlockHeight = await this.web3.eth.getBlockNumber()

    if (receipt) {
      return currentBlockHeight - receipt.blockNumber >= Ethereum.BLOCKS_TO_GO_BACK_FOR_CONFIRMATION
    } else {
      logger.error(`Receipt for txHash: ${txHash} doesn't exist`)
      return false
    }
  }

  public async transferToExchangeHoldingsFrom({ privateKey }: CryptoAddress, amount: number) {
    const decryptedPrivateKey = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!, this.decryptedHoldingsSecret)
    const toAddress = this.getAddressFromPrivateKey(decryptedPrivateKey)

    const { utils } = this.web3

    const weiAmount = utils.toBN(utils.toWei(amount.toString(), 'ether'))
    const gasPriceFromNode = await this.web3.eth.getGasPrice()
    const additionalGas = utils.toWei('20', 'Gwei')
    const gasPrice = new Decimal(gasPriceFromNode).add(additionalGas).toNumber()
    const totalGasEstimate = utils.toBN(gasPrice).mul(utils.toBN(21000))

    const adjustedAmount = utils.fromWei(weiAmount.sub(totalGasEstimate), 'ether')

    return this.transferTo({
      privateKey,
      amount: adjustedAmount,
      toAddress,
      gasPrice,
    })
  }

  public async transferFromExchangeHoldingsTo(toAddress: string, amount: number): Promise<TransactionResponse> {
    const holdingPrivateKey = await this.getDecryptedHoldingsSecret(process.env.ETHEREUM_HOLDINGS_SECRET!, this.decryptedHoldingsSecret)

    const { utils } = this.web3
    const gasPriceFromNode = await this.web3.eth.getGasPrice()
    const additionalGas = utils.toWei('20', 'Gwei')
    const gasPrice = new Decimal(gasPriceFromNode).add(additionalGas).toNumber()

    return this.transferTo({ amount, privateKey: holdingPrivateKey, toAddress, gasPrice })
  }

  public async transferTo({ privateKey, amount, toAddress, gasPrice }): Promise<TransactionResponse> {
    const { utils } = this.web3

    if (!gasPrice) {
      const gasPriceFromNode = await this.web3.eth.getGasPrice()
      const additionalGas = utils.toWei('20', 'Gwei')
      gasPrice = new Decimal(gasPriceFromNode).add(additionalGas).toNumber()
      logger.info(`ETH transferTo didnt recieve a gasPrice, calulating new one of: ${gasPrice}`)
    } else {
      logger.info(`ETH transferTo recieved a gasPrice of ${gasPrice}`)
    }

    const sender = await this.web3.eth.accounts.privateKeyToAccount(privateKey)

    const nonce = await this.web3.eth.getTransactionCount(sender.address, 'pending')

    const transaction = await sender.signTransaction({
      to: toAddress,
      value: this.web3.utils.toWei(amount.toString(), 'ether'),
      gas: 21000,
      gasPrice,
      nonce,
    })

    const sent = await this.web3.eth.sendSignedTransaction(transaction.rawTransaction)
    const fee = this.web3.utils.fromWei((21000 * gasPrice).toString(), 'ether')

    return { txHash: sent.transactionHash, transactionFee: fee }
  }

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

  private apiToDepositTransaction = (t: Transaction): DepositTransaction => {
    return {
      ...t,
      txHash: t.hash,
      amount: Number(this.web3.utils.fromWei(t.value, 'ether')),
    }
  }

  private async getDepositTransactionsForAccount(address: string, recordedTransactionHashesForAddress: string[]): Promise<Transaction[]> {
    const { response, success } = await this.getTransactionsFromEtherscan(address, recordedTransactionHashesForAddress)

    if (!success) {
      logger.warn(`Got a bad response from Etherscan for address ${address}. Falling back to Infura`)
      const latestTransactionsForAddress =
        recordedTransactionHashesForAddress && recordedTransactionHashesForAddress.length > 0 ? recordedTransactionHashesForAddress : undefined
      return this.getTransactionsFromBlocks(
        latestTransactionsForAddress,
        transaction => transaction.to === address,
        transaction => transaction.from === address,
      )
    }

    return response || []
  }

  private async getTransactionsFromEtherscan(
    address: string,
    lastSeenTransactionHashes: string[] = [],
  ): Promise<{ success: boolean; response?: Transaction[] }> {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return { success: false }
    }

    const [etherscanTransactions, etherscanInternalTransactions] = await Promise.all([
      getEthScanTransactionsForAddress<EtherscanTransaction>(address),
      getEthScanTransactionsForAddress<EtherscanInternalTransaction>(address, EthscanTransactionType.internal),
    ])

    if (etherscanTransactions.length === 0 && etherscanInternalTransactions.length === 0) {
      return { success: false }
    }

    const allDepositTransactions = etherscanTransactions
      .concat(etherscanInternalTransactions as any)
      .filter(({ to }) => to.toLowerCase() === address.toLowerCase())
    allDepositTransactions.sort((transactionA, transactionB) => Number(transactionA.timeStamp) - Number(transactionB.timeStamp))

    const depositTransactionsNotYetRecorded = allDepositTransactions
      .map(tx => !lastSeenTransactionHashes.includes(tx.hash) && tx)
      .filter(Boolean) as EtherscanTransaction[]
    logger.debug(
      `Transactions that have not yet been recorded for address ${address}, retrieved from etherscan: ${JSON.stringify(
        depositTransactionsNotYetRecorded,
      )}`,
    )

    const response = await this.retrieveFullWeb3DetailsForEtherscanTransactions(address, depositTransactionsNotYetRecorded)

    return {
      success: true,
      response,
    }
  }

  private async retrieveFullWeb3DetailsForEtherscanTransactions(
    address: string,
    newEtherscanTransactions: EtherscanTransaction[],
  ): Promise<Transaction[]> {
    const transactionHashToTransactionDetails = newEtherscanTransactions.reduce((allTransactions, transaction) => {
      allTransactions[transaction.hash] = transaction

      return allTransactions
    }, {} as Record<string, EtherscanTransaction>)

    const rawResponse = await Promise.all(newEtherscanTransactions.map(({ hash }) => this.web3.eth.getTransaction(hash)))
    logger.debug(`Transactions details for ${address} retrieved from web3: ${JSON.stringify(rawResponse)}`)

    /**
     * In the scenario when the transaction is internal the web3 retrieved {@code transaction.value} would be 0.
     * In that case we want to retrieve the value from the etherscan transaction details.
     */
    return rawResponse.map(transaction => ({
      ...transaction,
      value:
        transaction.value === '0' && transactionHashToTransactionDetails[transaction.hash].value !== '0'
          ? transactionHashToTransactionDetails[transaction.hash].value
          : transaction.value,
    }))
  }

  private async getTransactionsFromBlocks(
    lastSeenTransactionHashes: string[] = [],
    transactionFilter: (transaction: Transaction) => boolean = () => true,
    breakPredicate: (transaction: Transaction) => boolean = () => false,
  ) {
    const BLOCKS_TO_CHECK_FOR_DEPOSITS = (await getEthereumDepositMaxBlockCheck()) || 30
    const latestBlockNumber = await this.web3.eth.getBlockNumber()
    let blockNumber = latestBlockNumber
    const oldestBlockNumber = blockNumber - BLOCKS_TO_CHECK_FOR_DEPOSITS
    let allTransactions: Transaction[] = []

    let numberOfBlockRequest = 0
    while (blockNumber > oldestBlockNumber) {
      const block = await this.web3.eth.getBlock(blockNumber, true)
      if (!block || !block.transactions) {
        if (numberOfBlockRequest < 3) {
          numberOfBlockRequest += 1
        } else {
          numberOfBlockRequest = 0
          blockNumber -= 1
        }
        continue
      }

      allTransactions = allTransactions.concat(block.transactions.filter(transactionFilter))

      if (this.lastSeenTransactionsIncludedInBlock(lastSeenTransactionHashes, allTransactions) || !!block.transactions.find(breakPredicate)) {
        break
      }

      numberOfBlockRequest = 0
      blockNumber -= 1
    }
    const transactionsToReturn = !!lastSeenTransactionHashes
      ? allTransactions.filter(tx => !lastSeenTransactionHashes.includes(tx.hash))
      : allTransactions
    return transactionsToReturn
  }

  private lastSeenTransactionsIncludedInBlock(lastSeenTransactionHashes: string[], blockTransactions: Transaction[]) {
    return !!lastSeenTransactionHashes && blockTransactions.some(({ hash }) => lastSeenTransactionHashes.includes(hash))
  }
}
