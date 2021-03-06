import CryptoApis from 'cryptoapis.io'
import Decimal from 'decimal.js'

import { Route, Body, Post, Get, Hidden } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode, SymbolPairStateFilter } from '@abx-types/reference-data'
import { CurrencyManager, OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { Account, User } from '@abx-types/account'
import { findDepositAddressesForAccount } from '@abx-service-clients/deposit'
import { findCurrencyForCode } from '@abx-service-clients/reference-data'
import { wrapInTransaction, getModel, sequelize } from '@abx-utils/db-connection-utils'
import { VaultAddress } from '@abx-types/deposit'

const caClient = new CryptoApis(process.env.CRYPTO_APIS_TOKEN!)
caClient.BC.ETH.switchNetwork(caClient.BC.ETH.NETWORKS.ROPSTEN)

@Route('test-automation/deposit')
export class E2eTestingController {
  private readonly BTC_TESTNET_FEE = 0.00005

  private logger = Logger.getInstance('api', 'E2eTestingController')
  private currencyManager = new CurrencyManager()

  @Post('/transaction/eth')
  @Hidden()
  public async createTransactionETH(@Body() { fromAddress, toAddress, value, privateKey, nonce }): Promise<void> {
    this.logger.info('Creating new ETH transaction.')
    const gasPrice = 21000000000
    const gasLimit = 21000

    return caClient.BC.ETH.transaction.newTransactionWithPrivateKey(fromAddress, toAddress, privateKey, value, gasPrice, gasLimit, { nonce })
  }

  @Post('/transaction/btc')
  @Hidden()
  public async createTransactionBTC(@Body() { fromAddress, toAddress, value, wif }): Promise<void> {
    this.logger.info('Creating new BTC transaction.')

    caClient.BC.BTC.switchNetwork(caClient.BC.BTC.NETWORKS.TESTNET)

    const valueAfterFee = new Decimal(value).minus(this.BTC_TESTNET_FEE).toNumber()
    try {
      await caClient.BC.BTC.transaction.newTransaction(
        [{ address: fromAddress, value: valueAfterFee }],
        [{ address: toAddress, value: valueAfterFee }],
        { address: fromAddress, value: this.BTC_TESTNET_FEE },
        [wif],
      )
    } catch (e) {
      this.logger.error(e)
    }
  }

  @Post('/transaction')
  @Hidden()
  public async createTransaction(@Body() { currencyCode, privateKey, value, toAddress, signerKey }): Promise<void> {
    this.logger.info(`Creating new ${currencyCode} transaction.`)

    const currency: OnChainCurrencyGateway = this.currencyManager.getCurrencyFromTicker(currencyCode)

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
    const result = await currency.balanceAt(address)
    return result || 0
  }

  @Get('/address/{email}/{currencyCode}')
  @Hidden()
  public async getDepositAddress(email: string, currencyCode: CurrencyCode): Promise<string> {
    const account = await this.findAccount(email)
    if (!account) {
      throw new Error(`Account not found`)
    }

    const depositAddresses = await findDepositAddressesForAccount((account as Account).id)
    const currency = await findCurrencyForCode(currencyCode, SymbolPairStateFilter.all)
    const depositAddressForCurrency = depositAddresses.find(({ currencyId }) => currencyId === currency.id)!

    return Promise.resolve(depositAddressForCurrency.address || depositAddressForCurrency.publicKey)
  }

  @Post('/vault-address/remove')
  @Hidden()
  public async removeVaultAddress(@Body() { publicKey }): Promise<void> {
    await getModel<VaultAddress>('vaultAddress').destroy({ where: { publicKey }, force: true })
  }

  private async findAccount(email: string): Promise<Account | null> {
    return wrapInTransaction(sequelize, null, async (tran) => {
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
