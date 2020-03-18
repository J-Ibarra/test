const CryptoApis = require('cryptoapis.io')

import { Route, Body, Post, Get } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode, getEnvironment } from '@abx-types/reference-data'
import { CurrencyManager, OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { getModel, wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { Account, User } from '@abx-types/account'
import { findDepositAddressesForAccount } from '@abx-service-clients/deposit'
import { findCurrencyForCode } from '@abx-service-clients/reference-data'

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

  @Get('/address/{email}/{currencyCode}')
  public async getDepositAddress(email: string, currencyCode: CurrencyCode): Promise<string> {
    const account = await this.findAccount(email)
    if (!account) {
      throw new Error(`Account not found`)
    }

    const depositAddresses = await findDepositAddressesForAccount((account as Account).id)
    const currency = await findCurrencyForCode(currencyCode)
    const depositAddressesForCurrency = depositAddresses
      .filter(d => d.currencyId === currency.id)
      .map(d => d.address)

    if (depositAddressesForCurrency.length > 1) {
      throw new Error(`The user ${email} has more that 1 deposit address for ${currencyCode}`)
    }

    return Promise.resolve(depositAddressesForCurrency[0] as string)
  }

  private async findAccount(email: string): Promise<Account | null> {
    return wrapInTransaction(sequelize, null, async tran => {
      const account = await getModel<Account>('account').findOne({
        transaction: tran,
        include: [
          {
            model: getModel<User>('user'),
            as: 'users',
            where: {
              email
            }
          }
        ],
      })
  
      return account ? account.get() : null
    })
  }
}
