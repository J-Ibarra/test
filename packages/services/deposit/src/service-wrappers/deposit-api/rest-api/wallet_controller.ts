import { Controller, Get, Request, Route, Security, Post, Body, Tags } from 'tsoa'

import { Logger } from '@abx-utils/logging'
import { OverloadedRequest } from '@abx-types/account'
import { findDepositAddressAndListenForEvents } from '../../../core'
import { CurrencyCode, SymbolPairStateFilter } from '@abx-types/reference-data'
import { findDepositAddressesForAccount } from '../../../core'
import { findCryptoCurrencies } from '@abx-service-clients/reference-data'

@Tags('deposit')
@Route('/wallets')
export class WalletsController extends Controller {
  private logger = Logger.getInstance('api', 'WalletsController')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get()
  public async retrieveWalletAddressesForAccount(@Request() request: OverloadedRequest) {
    const { account } = request

    try {
      this.logger.debug(`Fetching wallets for account: ${account!.id}`)

      const [wallets, cryptoCurrencies] = await Promise.all([
        findDepositAddressesForAccount(account!.id),
        findCryptoCurrencies(SymbolPairStateFilter.all),
      ])
      const currencyIdToCurrency = cryptoCurrencies.reduce((acc, { code, id }) => acc.set(id, code), new Map<number, string>())
      this.logger.debug(`Retrieved ${wallets.length} wallets for account ${account!.id}`)

      return wallets.map((wallet) => ({
        publicKey: wallet.address || wallet.publicKey,
        currency: { id: wallet.currencyId, code: currencyIdToCurrency.get(wallet.currencyId) },
        transactionTrackingActivated: wallet.transactionTrackingActivated!,
      }))
    } catch (error) {
      this.logger.error(`Error fetching / creating new deposit addresses: ${error.message}`)

      this.setStatus(error.status || 400)

      return {
        message: error.message as string,
      }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post('/address/activation')
  public async activateWalletAddressForAccount(@Request() request: OverloadedRequest, @Body() body: { currencyCode: CurrencyCode }) {
    const { account } = request

    try {
      this.logger.debug(`Activating ${body.currencyCode} address for account id ${account?.id}`)

      const wallets = await findDepositAddressAndListenForEvents(account!, body.currencyCode)
      this.logger.debug(`Activated ${body.currencyCode} address for account id ${account?.id}`)

      return wallets
    } catch (error) {
      this.logger.error(`Error Activating deposit addresses: ${error.message}`)

      this.setStatus(error.status || 400)

      return {
        message: error.message as string,
      }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('kinesis-bank-details')
  public async retrieveKinesisBankDetails() {
    try {
      return {
        bankName: process.env.KINESIS_BANK_NAME!,
        bankCode: process.env.KINESIS_BANK_CODE!,
        accountNumber: process.env.KINESIS_BANK_ACCOUNT_NUMBER!,
        accountName: process.env.KINESIS_BANK_ACCOUNT_NAME!,
      }
    } catch (error) {
      this.logger.error('Error retrieving kinesis bank details')

      return {
        message: 'Error retrieving kinesis bank details',
      }
    }
  }
}
