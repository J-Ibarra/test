import { Controller, Request, Route, Security, Post } from 'tsoa'
import { CurrencyCode } from '@abx-types/reference-data'
import { OverloadedRequest } from '@abx-types/account'
import { Logger } from '@abx-utils/logging'
import { AddressGenerator } from '../core'
import { findCryptoCurrencies } from '@abx-service-clients/reference-data'

@Route('/address')
export class AddressGenerationController extends Controller {
  private logger = Logger.getInstance('api', 'WalletsController')
  private addressGenerator = new AddressGenerator()

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post('/{currency}')
  public async generateWalletAddressForAccount(currency: CurrencyCode, @Request() request: OverloadedRequest) {
    try {
      const { account } = request

      const cryptoCurrency = await this.isCryptoCurrencyValid(currency)

      if (!cryptoCurrency) {
        return this.setStatus(400)
      }

      this.logger.debug(`Generating wallet address of currency: ${currency} for ${account!.id}`)

      const { publicKey } = await this.addressGenerator.generateDepositAddress(account!.id, currency)

      this.logger.info(`Successfully created wallet address of currency: ${currency} for ${account!.id}`)

      return publicKey
    } catch (error) {
      this.logger.error(`Error creating wallet address of currency ${currency}: ${error.message}`)
      this.setStatus(error.status || 400)

      return {
        message: error.message as string,
      }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post('/{currency}/transaction-subscription')
  public async listenToAddressEventsForAccount(currency: CurrencyCode, @Request() request: OverloadedRequest) {
    try {
      const { account } = request

      const cryptoCurrency = await this.isCryptoCurrencyValid(currency)

      if (!cryptoCurrency) {
        this.logger.debug(`${currency} fis not a valid crypto currency`)
        return this.setStatus(400)
      }

      this.logger.debug(`Setting up address transaction subscription for ${currency} and account ${account!.id}`)

      await this.addressGenerator.addAddressTransactionListener(account!.id, cryptoCurrency)

      this.logger.debug(`Successfully set up address transaction subscription for currency ${currency} and account ${account!.id}`)
    } catch (error) {
      this.logger.error(`Error creating event listener of currency ${currency}: ${error.message}`)

      this.setStatus(error.status || 400)

      return {
        message: error.message as string,
      }
    }
  }

  private async isCryptoCurrencyValid(currencyTicker: CurrencyCode) {
    const allCryptoCurrencies = await findCryptoCurrencies()

    return allCryptoCurrencies.find(currency => currency.code === currencyTicker)
  }
}
