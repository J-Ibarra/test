import { Controller, Get, Request, Route, Tags } from 'tsoa'
import { OverloadedRequest } from '@abx-types/account'
import { findCurrenciesByAccountId } from '../core'

@Tags('reference-data')
@Route('currencies')
export class CurrenciesController extends Controller {
  @Get()
  public async getCurrencies(@Request() request: OverloadedRequest) {
    return findCurrenciesByAccountId(request.account!.id)
  }
}
