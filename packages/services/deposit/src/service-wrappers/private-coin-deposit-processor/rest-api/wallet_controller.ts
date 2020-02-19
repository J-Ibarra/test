import { Controller, Get, Request, Route, Security } from 'tsoa'

import { Logger } from '@abx-utils/logging'
import { OverloadedRequest } from '@abx-types/account'
import { findDepositAddressesForAccount } from '../../../core'

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

      const wallets = await findDepositAddressesForAccount(account!.id)
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
