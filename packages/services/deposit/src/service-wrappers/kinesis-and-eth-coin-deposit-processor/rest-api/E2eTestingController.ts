const CryptoApis = require('cryptoapis.io')

import { Route, Body, Post } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode, getEnvironment } from '@abx-types/reference-data'
import { CurrencyManager, OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'

const apiKey = '99fd56a51dcdf7e069402d68f605fad34d656301'
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
