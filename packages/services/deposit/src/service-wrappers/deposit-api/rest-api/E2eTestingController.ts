const CryptoApis = require('cryptoapis.io')

import { Route, Body, Post } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode, getEnvironment } from '@abx-types/reference-data'
import { CurrencyManager, OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'

const apiKey = '801c9ee2538cb40da9dbc03790894ea3431fb8ac'
const caClient = new CryptoApis(apiKey)
caClient.BC.ETH.switchNetwork(caClient.BC.ETH.NETWORKS.ROPSTEN)

@Route('test-automation/deposit')
export class E2eTestingController {
  private logger = Logger.getInstance('api', 'E2eTestingController')
  private currencyManager = new CurrencyManager(
    getEnvironment(),
    [CurrencyCode.kau, CurrencyCode.kag, CurrencyCode.kvt]
  )

  @Post('/transaction/eth')
  public async createTransactionETH(@Body() { fromAddress, toAddress, value, privateKey }): Promise<void> {
    this.logger.info('Creating new ETH transaction.')
    const gasPrice = 21000000000
    const gasLimit = 21000

    return caClient.BC.ETH.transaction.newTransactionWithPrivateKey(
      fromAddress,
      toAddress,
      privateKey,
      value,
      gasPrice,
      gasLimit
    )
  }

  @Post('/transaction/btc')
  public async createTransactionBTC(@Body() { fromAddress, toAddress, value, wif }): Promise<void> {
    this.logger.info('Creating new BTC transaction.')


    // let transactionHash
    // try {
    //   transactionHash = await this.sendTransaction(fromAddress, toAddress, value, transactionFee)
    //   this.logger.info(`Successfully sent transaction with hash ${transactionHash} for ${value} from ${fromAddress.address} to ${toAddress}`)
    // } catch (e) {
    //   const errorMessage = `An error has ocurred while trying to send transaction for transaction of ${value} from ${fromAddress.address} to ${toAddress}`
    //   this.logger.error(`${errorMessage} ${JSON.stringify(util.inspect(e))}`)

    //   throw new ApiProviderError(errorMessage)
    // }

    // if (!!webhookCallbackUrl) {
    //   await this.createTransactionConfirmationWebhook(transactionHash, webhookCallbackUrl, webhookRegistrationFailureUrl!)
    // }

    // return {
    //   txHash: transactionHash,
    //   transactionFee: estimatedTransactionFee,
    // }




    // const bitcoinBlockchainFacade: BlockchainFacade = new BitcoinBlockchainFacade()
    // await bitcoinBlockchainFacade.createTransaction({
    //   senderAddress: {
    //     privateKey,
    //     address: fromAddress,
    //     wif
    //   },
    //   receiverAddress: toAddress,
    //   amount: value
    // })

    caClient.BC.BTC.switchNetwork(caClient.BC.BTC.NETWORKS.TESTNET)
    try {
      await caClient.BC.BTC.transaction.newTransaction(
        [{address: fromAddress, value}],
        [{address: toAddress, value}],
        {address: fromAddress, value: 0.000004},
        [wif]
      )
    } catch (e) {
      this.logger.error(e)
    }
  }

  @Post('/transaction')
  public async createTransaction(@Body() { currencyCode, privateKey, value, toAddress, signerKey }): Promise<void> {
    this.logger.info(`Creating new ${currencyCode} transaction.`)

    const currency: OnChainCurrencyGateway = this.currencyManager.getCurrencyFromTicker(currencyCode)

    await currency.transferTo({
      privateKey,
      amount: value,
      toAddress,
      signerKey
    })
  }
}
