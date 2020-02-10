import { BlockchainFacade } from '../BlockchainFacade'
import { TransactionResponse } from '../../currency_gateway'
import { CryptoApis, ENetworkTypes } from '../providers/cryptoApis'
import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { CryptoAddress } from '../model'
import { Transaction } from '../model/Transaction'

const BITCOIN_CONFIG = {
  [Environment.development]: {
    network: ENetworkTypes.TESTNET,
    token: process.env.CRYPTO_APIS_TOKEN,
  },
  [Environment.test]: {
    network: ENetworkTypes.TESTNET,
    token: process.env.CRYPTO_APIS_TOKEN,
  },
  [Environment.e2eLocal]: {
    network: ENetworkTypes.TESTNET,
    token: process.env.CRYPTO_APIS_TOKEN,
  },
  [Environment.e2eAws]: {
    network: ENetworkTypes.TESTNET,
    token: process.env.CRYPTO_APIS_TOKEN,
  },
  [Environment.integration]: {
    network: ENetworkTypes.TESTNET,
    token: process.env.CRYPTO_APIS_TOKEN,
  },
  [Environment.uat]: {
    network: ENetworkTypes.TESTNET,
    token: process.env.CRYPTO_APIS_TOKEN,
  },
  [Environment.production]: {
    network: ENetworkTypes.MAINNET,
    token: process.env.CRYPTO_APIS_TOKEN,
  },
}

export class BitcoinBlockchainFacade implements BlockchainFacade {
  private ticker = CurrencyCode.bitcoin
  private cryptoApis: CryptoApis
  constructor(env: Environment) {
    this.cryptoApis = new CryptoApis(this.ticker, BITCOIN_CONFIG[env].network, BITCOIN_CONFIG[env].token)
  }

  // TODO
  createTransaction(
    senderAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>,
    receiverPublicAddress: string,
    amount: number,
  ): Promise<TransactionResponse> {
    console.log(senderAddress, receiverPublicAddress, amount)
    return null as any
  }

  async getTransaction(transactionHash: string): Promise<Transaction> {
    return this.cryptoApis.getTransactionDetails({ txID: transactionHash })
  }

  async generateAddress(): Promise<CryptoAddress> {
    const generatedAddress = await this.cryptoApis.generateAddress()

    this.cryptoApis.addressEventSubscription({
      address: generatedAddress.publicKey,
      callbackURL: `${process.env.API_URL}/webhooks/crypto/address-transactions`,
      confirmations: 2,
    })

    return generatedAddress
  }

  async balanceAt(address: string): Promise<number> {
    return Number((await this.cryptoApis.getAddressDetails({ publicKey: address })).balance)
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      const addressDetails = await this.cryptoApis.getAddressDetails({ publicKey: address })
      return addressDetails.address === address
    } catch (e) {
      return false
    }
  }

  async validateAddressIsNotContractAddress(address: string): Promise<boolean> {
    return address !== process.env.BTC_CONTRACT_ADDRESS
  }
}
