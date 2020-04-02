const CryptoApis = require('cryptoapis.io')

import { Route, Body, Post, Get, Hidden } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode, getEnvironment } from '@abx-types/reference-data'
import { CurrencyManager, OnChainCurrencyGateway, Kinesis } from '@abx-utils/blockchain-currency-gateway'
import { findDepositAddressesForAccount } from '@abx-service-clients/deposit'
import { findCurrencyForCode } from '@abx-service-clients/reference-data'
import { wrapInTransaction, getModel, sequelize } from '@abx-utils/db-connection-utils'
import { User } from '@abx-types/account'
import { VaultAddress } from '@abx-types/deposit'

const caClient = new CryptoApis(process.env.CRYPTO_APIS_TOKEN!)
caClient.BC.ETH.switchNetwork(caClient.BC.ETH.NETWORKS.ROPSTEN)

@Route('test-automation/deposit')
export class E2eTestingController {
  private logger = Logger.getInstance('api', 'E2eTestingController')
  private currencyManager = new CurrencyManager(getEnvironment(), [CurrencyCode.kau, CurrencyCode.kag, CurrencyCode.kvt, CurrencyCode.ethereum])

  @Post('/transaction/eth')
  @Hidden()
  public async createTransactionETH(@Body() { fromAddress, toAddress, value, privateKey, nonce }): Promise<void> {
    this.logger.info('Creating new ETH transaction.')
    const gasPrice = 21000000000
    const gasLimit = 21000

    return caClient.BC.ETH.transaction.newTransactionWithPrivateKey(fromAddress, toAddress, privateKey, value, gasPrice, gasLimit, { nonce })
  }

  @Post('/transaction')
  @Hidden()
  public async createTransaction(@Body() { currencyCode, privateKey, value, toAddress, signerKey }): Promise<void> {
    this.logger.info(`Creating new ${currencyCode} transaction.`)

    const currency: OnChainCurrencyGateway = this.currencyManager.getCurrencyFromTicker(currencyCode)

    const pK = await (currency as Kinesis)['getAddressFromPrivateKey'](privateKey)
    this.logger.info(pK)

    await currency.transferTo({
      privateKey,
      amount: value,
      toAddress,
      signerKey,
    })
  }

  @Get('/balance/{address}/{currencyCode}')
  @Hidden()
  public async getBalanceByCurrencyAndPublicKey(address: string, currencyCode: CurrencyCode): Promise<number> {

    const currency: OnChainCurrencyGateway = this.currencyManager.getCurrencyFromTicker(currencyCode)

    return currency.balanceAt(address)
  }

  @Get('/address/{email}/{currencyCode}')
  @Hidden()
  public async getDepositAddress(email: string, currencyCode: CurrencyCode): Promise<string> {
    const account = await this.findAccount(email)
    if (!account) {
      throw new Error(`Account not found`)
    }

    const depositAddresses = await findDepositAddressesForAccount((account as Account).id)
    const currency = await findCurrencyForCode(currencyCode)
    const depositAddressesForCurrency = depositAddresses.filter(d => d.currencyId === currency.id).map(d => d.publicKey)

    if (depositAddressesForCurrency.length > 1) {
      throw new Error(`The user ${email} has more that 1 deposit address for ${currencyCode}`)
    }

    return Promise.resolve(depositAddressesForCurrency[0] as string)
  }

  @Post('/vault-address/remove')
  @Hidden()
  public async removeVaultAddress(@Body() { publicKey }): Promise<void> {
    await getModel<VaultAddress>('vaultAddress').destroy({ where: { publicKey }, force: true })
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
              email,
            },
          },
        ],
      })

      return account ? account.get() : null
    })
  }
}
