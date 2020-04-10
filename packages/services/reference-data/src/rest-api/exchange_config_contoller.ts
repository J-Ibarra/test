import { Controller, Get, Route, Security, Tags } from 'tsoa'
import { getTransactionFeeCaps } from '../core'

@Tags('reference-data')
@Route()
export class ExchangeConfigController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/fees/transaction')
  public async retrieveAllFeatureFlags() {
    return getTransactionFeeCaps()
  }
}
