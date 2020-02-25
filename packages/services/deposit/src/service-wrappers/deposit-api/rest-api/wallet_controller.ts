import { Controller, Get, Request, Route, Security, Post, Body } from 'tsoa'

import { Logger } from '@abx-utils/logging'
import { OverloadedRequest } from '@abx-types/account'
import { findOrCreateDepositAddressesForAccount, findDepositAddressAndListenForEvents } from '../../../core'
import { CurrencyCode } from '@abx-types/reference-data'

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

      const wallets = await findOrCreateDepositAddressesForAccount(account!.id)
      this.logger.debug(`Retrieved ${wallets.length} wallets for account ${account!.id}`)

      return wallets
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
  public async activateWalletAddressForAccount(
    @Request() request: OverloadedRequest,
    @Body() body: { publicKey: string; currencyCode: CurrencyCode },
  ) {
    const { account } = request

    try {
      this.logger.debug(`Activating ${body.currencyCode} address for account id ${account?.id}`)

      const wallets = await findDepositAddressAndListenForEvents(account!, body.publicKey, body.currencyCode)
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
