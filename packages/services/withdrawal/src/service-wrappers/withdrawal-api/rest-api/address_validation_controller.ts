import { Controller, Get, Query, Route, Security, Tags } from 'tsoa'

import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { AddressValidationParams, validateCryptoAddress } from '@abx-utils/blockchain-currency-gateway'

@Tags('withdrawal')
@Route('/crypto')
export class CryptoController extends Controller {
  private logger = Logger.getInstance('api', 'crypto')

  @Security('cookieAuth')
  @Get('/validate')
  public async validateAddressForCrypto(@Query('code') code: CurrencyCode, @Query('address') address: string) {
    const request = { code, address } as AddressValidationParams

    try {
      return await validateCryptoAddress(request)
    } catch (error) {
      this.setStatus(error.status || 400)
      this.logger.error(`${request.address} for currency ${request.code} is invalid. errors: ${error.status || 400} - ${error.message}`)
      this.logger.error(error.context ? JSON.stringify(error.context) : '')
      return error.message as string
    }
  }
}
