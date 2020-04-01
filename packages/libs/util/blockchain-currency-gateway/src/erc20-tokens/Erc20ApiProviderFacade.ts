import { Environment, CurrencyCode } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { CryptoApisProviderProxyEth, ENetworkTypes, IAddressTransaction } from '../api-provider'
import { Transaction, CryptoAddress } from '../model'
import { BlockchainApiProviderFacade } from '../api-provider/BlockchainApiProviderFacade'
import { TransactionResponse } from '../currency_gateway'
import moment from 'moment'

export const mainnetEnvironments = [Environment.production]

export class Erc20ApiProviderFacade implements BlockchainApiProviderFacade {
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'EthereumBlockchainFacade')
  private readonly DEFAULT_ERC20_TRANSACTION_CONFIRMATIONS = 1

  private cryptoApiProviderProxyEth: CryptoApisProviderProxyEth

  constructor(private currency: CurrencyCode) {
    this.cryptoApiProviderProxyEth = new CryptoApisProviderProxyEth(
      CurrencyCode.ethereum,
      mainnetEnvironments.includes(process.env.NODE_ENV as Environment) ? ENetworkTypes.MAINNET : ENetworkTypes.ETH_TESTNET,
      process.env.CRYPTO_APIS_TOKEN!,
    )
  }

  async getAddressBalance(address: string, contract: string): Promise<number> {
    const addressDetails = await this.cryptoApiProviderProxyEth.getErc20TokenBalance(address, contract)

    return Number(addressDetails.token)
  }

  createTransaction(): Promise<TransactionResponse> {
    throw new Error(`Unsupported operation for currency ${this.currency} - createTransaction`)
  }

  async getTransaction(_transactionHash: string, _targetAddress: string): Promise<Transaction | null> {
    const transaction = await this.cryptoApiProviderProxyEth.getTransactionDetails({ TX_HASH: _transactionHash })
    const tokenTransfer = transaction.token_transfers[0]

    return {
      transactionHash: _transactionHash,
      time: moment(transaction.timestamp).toDate(),
      amount: Number(tokenTransfer.value),
      senderAddress: tokenTransfer.from,
      receiverAddress: tokenTransfer.to,
      confirmations: Number(transaction.confirmations),
    }
  }

  async generateAddress(): Promise<CryptoAddress> {
    try {
      const generatedAddress = await this.cryptoApiProviderProxyEth.generateAddress()

      return generatedAddress
    } catch (e) {
      this.LOGGER.error(`An error has ocurred when generating ETH address, requested for ${this.currency} token`)
      this.LOGGER.error(JSON.stringify(e))

      throw e
    }
  }

  async balanceAt(address: string): Promise<number> {
    const addressDetails = await this.cryptoApiProviderProxyEth.getAddressDetails({ address: address })

    return Number(addressDetails.balance)
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      const addressDetails = await this.cryptoApiProviderProxyEth.getAddressDetails({ address: address })
      return addressDetails.address === address
    } catch (e) {
      this.LOGGER.debug(`Unable to retrieve address details for address ${address}`)
      return false
    }
  }

  async subscribeToTransactionConfirmationEvents(transactionHash: string, callbackURL: string): Promise<void> {
    await this.cryptoApiProviderProxyEth.createConfirmedTransactionEventSubscription({
      transactionHash,
      callbackURL,
      confirmations: this.DEFAULT_ERC20_TRANSACTION_CONFIRMATIONS,
    })
  }

  async subscribeToAddressTransactionEvents(address: string, confirmations: number): Promise<IAddressTransaction> {
    return this.cryptoApiProviderProxyEth.createAddressTokenTransactiontEventSubscription({
      address,
      confirmations,
      callbackURL: process.env.DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_CALLBACK_URL!,
    })
  }
}
