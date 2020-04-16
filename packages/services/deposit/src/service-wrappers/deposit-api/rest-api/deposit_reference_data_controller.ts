import { Controller, Get, Route, Security, Tags } from 'tsoa'
import { minimumDepositAmountDictionary } from '../../../core'
import { CurrencyCode } from '@abx-types/reference-data'

@Tags('deposit')
@Route('/deposits')
export class DepositController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/minimum-amounts')
  public async getMinimumDepositAmounts() {
    return minimumDepositAmountDictionary as Record<CurrencyCode, number>
  }
}
