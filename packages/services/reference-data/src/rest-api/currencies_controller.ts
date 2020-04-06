import { Controller, Get, Request, Route } from 'tsoa'
import { OverloadedRequest } from '@abx-types/account'
import { findCurrenciesByAccountId } from '../core'

@Route('currencies')
export class CurrenciesController extends Controller {
  @Get()
  public async getCurrencies(@Request() request: OverloadedRequest) {
    return findCurrenciesByAccountId(request.account!.id)
  }
}
