import { CryptoAddress, CreateEthTransactionPayload,CreateERC_20TransactionPayload, ApiProviderError } from '../model'
import { TransactionResponse, TransactionResponseERC_20 } from '../../currency_gateway'
import Decimal from 'decimal.js'
import util from 'util'
import { Logger } from '@abx-utils/logging'
import { MemoryCache } from '@abx-utils/db-connection-utils'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'
import { EndpointInvocationUtils } from '../providers/EndpointInvocationUtils'
import { CryptoApisProviderProxyEth, IConfirmedTransactionEth } from '../providers/crypto-apis'
//import * as bitcoin from 'bitcoinjs-lib'
import Web3 from 'web3'
import { mainnetEnvironments } from './EthereumBlockchainFacade'
import { Environment } from '@abx-types/reference-data'
import { number } from 'bitcoinjs-lib/types/script'

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

export class EthereumTransactionDispatcher {
    private web3: Web3
    private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'EthereumBlockchainFacade')
    private readonly AVERAGE_FEE_PER_BYTE = 'avg-fee-per-byte'
    private readonly AVERAGE_FEE_PER_TRANSACTION = 'avg-fee-per-transaction'
    private readonly CACHE_EXPIRY_IN_MILLIS = 1000 * 60 * 30
    private readonly MAX_TETHER_DECIMALS = 8
    //private readonly network = mainnetEnvironments.includes(process.env.NODE_ENV as Environment) ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
  
    constructor(private CryptoApisProviderProxyEth: CryptoApisProviderProxyEth) {
    
        this.web3 = new Web3(ETH_CONFIG[Environment.development].url)
      
    }
     /**
   * The transaction creation workflow contains 3 steps (3rd step is optional):
   * 1. Calculating fee based on the transaction size
   * 2. Create Transaction -> Sign -> Send on-chain
   * 3. Optionally register a transaction confirmation webhook
   */
    public async createTransaction({  //Revisar
      fromAddress,
      toAddress,
      value,
      password,
      webhookCallbackUrl,
      webhookRegistrationFailureUrl,

      }: CreateEthTransactionPayload): Promise<TransactionResponse> {
        //let estimatedTransactionFee
        let gasPrice
        let gasLimited
        try {
          //estimatedTransactionFee = await this.estimateTransactionFee(fromAddress, toAddress, value)
          const {recommended} = await this.CryptoApisProviderProxyEth.getTransactionsFee()
          gasPrice = recommended
          this.LOGGER.info(`Estimated fee of ${recommended} for transaction of ${value} from ${fromAddress.address!} to ${toAddress}`)
        } catch (e) {
          const errorMessage = `An error has ocurred while trying to calculate fee for transaction of ${value} from ${fromAddress.address!} to ${toAddress}`
          this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)
    
          throw new ApiProviderError(errorMessage)
        }

        try {
          //estimatedTransactionFee = await this.estimateTransactionFee(fromAddress, toAddress, value)
          const {gasLimit} = await this.CryptoApisProviderProxyEth.estimateTransactionGas(fromAddress.address!,toAddress,value)
          gasLimited = gasLimit
          this.LOGGER.info(`Estimated fee of ${gasLimit} for transaction of ${value} from ${fromAddress.address!} to ${toAddress}`)
        } catch (e) {
          const errorMessage = `An error has ocurred while trying to calculate fee for transaction of ${value} from ${fromAddress.address!} to ${toAddress}`
          this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)
    
          throw new ApiProviderError(errorMessage)
        }
    
        let transactionHash
        try {
          transactionHash = await this.sendTransaction(fromAddress,toAddress,gasPrice,gasLimited,value,password)
          this.LOGGER.info(`Successfully sent transaction with hash ${transactionHash} for ${value} from ${fromAddress.address!} to ${toAddress}`)
        } catch (e) {
          const errorMessage = `An error has ocurred while trying to send transaction for transaction of ${value} from ${fromAddress.address!} to ${toAddress}`
          this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)
    
          throw new ApiProviderError(errorMessage)
        }
    
        if (!!webhookCallbackUrl) {
          await this.createTransactionConfirmationWebhook(transactionHash, webhookCallbackUrl, webhookRegistrationFailureUrl!)
        }
    
        return {
          txHash: transactionHash,
          transactionFee: gasLimited,
        }
      }
        
      private async sendTransaction(
        FromAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>,
        ToAddress: string,
        value: number,
        gasPrice: number,
        gasLimit: number,
        password?: string,
      ): Promise<string> {
        const { hex: transactionHex } = await this.CryptoApisProviderProxyEth.createTransaction(FromAddress.address!,ToAddress,value,gasPrice,gasLimit,password)
        /*let tx = {
          from: FromAddress.address!,
          to: ToAddress,
          value: value,
          gasLimit: gasLimit,
          gasPrice: gasPrice}*/
        const signedTransactionHex = this.signTransaction(transactionHex, FromAddress.privateKey)
        
        const { hex } = await this.CryptoApisProviderProxyEth.broadcastTransaction(signedTransactionHex)
        return hex
      }

      /** In order to keep all wifs private we use offline/native signing (instead of submitting request to the API provider). */
      private signTransaction(transactionHex: string, privateKey: string): string {  //
        
        //const { hex: transactionHex }  = this.web3.eth.accounts.signTransaction(transactionHex,privateKey)
        const { messageHash }  = this.web3.eth.accounts.sign(transactionHex,privateKey)
        return messageHash
        
      }
      
      /**
   * Creates a transaction confirmation webhook using {@link BlockchainFacadeUtils.invokeEndpointWithProgressiveRetry} to
   * progressive retry on unsuccessful registration response.
   *
   * If, regardless of the retry mechanism, webhook registration fails. A message is pushed to {@code webhookRegistrationFailureUrl} (SQS URL for aws environments).
   *
   * @param transactionHash the created transaction hash
   * @param webhookCallbackUrl the URL where the webhook notification is pushed
   * @param webhookRegistrationFailureUrl the URL where a message is pushed if the confirmed transaction webhook registration fails
   */
      private async createTransactionConfirmationWebhook(transactionHash: string, webhookCallbackUrl: string, webhookRegistrationFailureUrl: string) {
        try {
          const { confirmations, created } = await EndpointInvocationUtils.invokeEndpointWithProgressiveRetry<IConfirmedTransactionEth>({
            name: 'createConfirmedTransactionWebHook',
            endpointInvoker: () =>
              this.CryptoApisProviderProxyEth.createConfirmedTransactionEventSubscription({
                callbackURL: webhookCallbackUrl,
                transactionHash,
                confirmations: Number(process.env.BITCOIN_CONFIRMATION_BLOCKS),
              }),
          })
    
          this.LOGGER.debug(`Successfully created confirmed transaction webhook for ${transactionHash}. Confirmation: ${confirmations}, ${created}`)
        } catch (e) {
          const errorMessage = `An error has ocurred while trying to subscribe for transaction confirmation webhook for ${transactionHash}`
          this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)
    
          await sendAsyncChangeMessage({
            type: 'createTransactionConfirmationWebhook-failure',
            target: {
              local: 'createTransactionConfirmationWebhook-failure-local',
              deployedEnvironment: webhookRegistrationFailureUrl,
            },
            payload: {
              transactionHash,
            },
          })
        }
      }
    
    
    }

export class ERC_20TransactionDispatcher {
  private web3: Web3
  private readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'EthereumBlockchainFacade')
  private readonly AVERAGE_FEE_PER_BYTE = 'avg-fee-per-byte'
  private readonly AVERAGE_FEE_PER_TRANSACTION = 'avg-fee-per-transaction'
  private readonly CACHE_EXPIRY_IN_MILLIS = 1000 * 60 * 30
  private readonly MAX_TETHER_DECIMALS = 8
  //private readonly network = mainnetEnvironments.includes(process.env.NODE_ENV as Environment) ? bitcoin.networks.bitcoin : bitcoin.networks.testnet

  constructor(private CryptoApisProviderProxyEth: CryptoApisProviderProxyEth) {
  
      this.web3 = new Web3(ETH_CONFIG[Environment.development].url)
    
  }
   /**
 * The transaction creation workflow contains 3 steps (3rd step is optional):
 * 1. Calculating fee based on the transaction size
 * 2. Create Transaction -> Sign -> Send on-chain
 * 3. Optionally register a transaction confirmation webhook
 */
  public async createTransaction({  //Revisar
    fromAddress,
    toAddress,
    token,
    contract,
    password,
    webhookCallbackUrl,
    webhookRegistrationFailureUrl,

    }: CreateERC_20TransactionPayload): Promise<TransactionResponseERC_20> {
      //let estimatedTransactionFee
      let gasPrice
      let gasLimited
      try {
        //estimatedTransactionFee = await this.estimateTransactionFee(fromAddress, toAddress, value)
        const {recommended} = await this.CryptoApisProviderProxyEth.getTransactionsFee()
        gasPrice = recommended
        this.LOGGER.info(`Estimated fee of ${recommended} for transaction of token ammount ${token} from ${fromAddress.address!} to ${toAddress}`)
      } catch (e) {
        const errorMessage = `An error has ocurred while trying to calculate fee for token ${token} from ${fromAddress.address!} to ${toAddress}`
        this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)
  
        throw new ApiProviderError(errorMessage)
      }

      try {
        //estimatedTransactionFee = await this.estimateTransactionFee(fromAddress, toAddress, value)
        const {gasLimit} = await this.CryptoApisProviderProxyEth.estimateTransactionGas(fromAddress.address!,toAddress,token)
        gasLimited = gasLimit
        this.LOGGER.info(`Estimated fee of ${gasLimit} for transaction of token ammount ${token} from ${fromAddress.address!} to ${toAddress}`)
      } catch (e) {
        const errorMessage = `An error has ocurred while trying to calculate fee for transaction of token ammount ${token} from ${fromAddress.address!} to ${toAddress}`
        this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)
  
        throw new ApiProviderError(errorMessage)
      }
  
      let transactionHash
      try {
        transactionHash = await this.sendTransaction(fromAddress,toAddress,gasPrice,gasLimited,token,contract,password)
        this.LOGGER.info(`Successfully sent transaction with hash ${transactionHash} for ${token} from ${fromAddress.address!} to ${toAddress}`)
      } catch (e) {
        const errorMessage = `An error has ocurred while trying to send transaction for transaction of ${token} from ${fromAddress.address!} to ${toAddress}`
        this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)
  
        throw new ApiProviderError(errorMessage)
      }
  
      if (!!webhookCallbackUrl) {
        await this.createTransactionConfirmationWebhook(transactionHash, webhookCallbackUrl, webhookRegistrationFailureUrl!)
      }
  
      return {
        hex: transactionHash
      }
    }
      
    private async sendTransaction(
      FromAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>,
      ToAddress: string,
      gasPrice: number,
      gasLimit: number,
      token: number,
      contract: string,
      password?: string,
    ): Promise<string> {
      const { hex } = await this.CryptoApisProviderProxyEth.createTransactionERC_20(FromAddress.address!,ToAddress,gasPrice,gasLimit,token,contract,password)
     
      return hex
    }
    
    /**
 * Creates a transaction confirmation webhook using {@link BlockchainFacadeUtils.invokeEndpointWithProgressiveRetry} to
 * progressive retry on unsuccessful registration response.
 *
 * If, regardless of the retry mechanism, webhook registration fails. A message is pushed to {@code webhookRegistrationFailureUrl} (SQS URL for aws environments).
 *
 * @param transactionHash the created transaction hash
 * @param webhookCallbackUrl the URL where the webhook notification is pushed
 * @param webhookRegistrationFailureUrl the URL where a message is pushed if the confirmed transaction webhook registration fails
 */
    private async createTransactionConfirmationWebhook(transactionHash: string, webhookCallbackUrl: string, webhookRegistrationFailureUrl: string) {
      try {
        const { confirmations, created } = await EndpointInvocationUtils.invokeEndpointWithProgressiveRetry<IConfirmedTransactionEth>({
          name: 'createConfirmedTransactionWebHook',
          endpointInvoker: () =>
            this.CryptoApisProviderProxyEth.createConfirmedTransactionEventSubscription({
              callbackURL: webhookCallbackUrl,
              transactionHash,
              confirmations: Number(process.env.BITCOIN_CONFIRMATION_BLOCKS),
            }),
        })
  
        this.LOGGER.debug(`Successfully created confirmed transaction webhook for ${transactionHash}. Confirmation: ${confirmations}, ${created}`)
      } catch (e) {
        const errorMessage = `An error has ocurred while trying to subscribe for transaction confirmation webhook for ${transactionHash}`
        this.LOGGER.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)
  
        await sendAsyncChangeMessage({
          type: 'createTransactionConfirmationWebhook-failure',
          target: {
            local: 'createTransactionConfirmationWebhook-failure-local',
            deployedEnvironment: webhookRegistrationFailureUrl,
          },
          payload: {
            transactionHash,
          },
        })
      }
    }

}
    