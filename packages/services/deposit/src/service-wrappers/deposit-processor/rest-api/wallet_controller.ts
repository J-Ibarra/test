import { Controller, Get, Request, Route, Security, Post } from 'tsoa'

import { Logger } from '@abx-utils/logging'
import { OverloadedRequest } from '@abx-types/account'
import { findDepositAddressesForAccount, generateDepositAddressForAccount } from '../../../core'
import { CurrencyCode } from '@abx-types/reference-data'
import { ValidationError } from '@abx-types/error'

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

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post('/address/{currency}')
  public async generateWalletAddressForAccount(currency: CurrencyCode, @Request() request: OverloadedRequest) {
    try {
      const { account } = request

      if (!account) {
        throw new ValidationError('Account not supplied')
      }

      this.logger.debug(`Generating wallet address of currency: ${currency} for ${account!.id}`)

      const { publicKey } = await generateDepositAddressForAccount(account.id, currency)

      this.logger.debug(`Successfully created wallet address of currency: ${currency} for ${account.id}`)

      return publicKey
    } catch (error) {
      this.logger.error(`Error creating wallet address of currency ${currency}: ${error.message}`)

      this.setStatus(error.status || 400)

      return {
        message: error.message as string,
      }
    }
  }
}
