import { Controller, Get, Route, Security, Tags } from 'tsoa'
import { getTransactionFeeCaps, getMobileVersions } from '../core'

@Tags('reference-data')
@Route()
export class ExchangeConfigController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/fees/transaction')
  public async retrieveTransactionFeeCaps() {
    return getTransactionFeeCaps()
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/mobile/versions')
  public async retrieveMobileVersions() {
    return getMobileVersions()
  }
}
