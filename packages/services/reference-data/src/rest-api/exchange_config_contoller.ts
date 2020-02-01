import { Controller, Get, Route, Security } from 'tsoa'
import { getTransactionFeeCaps } from '../core'

@Route()
export class ExchangeConfigController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/fees/transaction')
  public async retrieveAllFeatureFlags() {
    return getTransactionFeeCaps()
  }
}
