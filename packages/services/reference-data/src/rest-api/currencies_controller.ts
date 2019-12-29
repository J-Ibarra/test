import { Controller, Get, Route } from 'tsoa'
import { findAllCurrencies } from '../core'

@Route('currencies')
export class CurrenciesController extends Controller {
  @Get()
  public async getCurrencies() {
    return findAllCurrencies()
  }
}
