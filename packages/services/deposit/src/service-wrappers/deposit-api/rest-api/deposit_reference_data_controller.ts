import { Controller, Get, Route, Security, Tags } from 'tsoa'
import { getDepositMimimumAmounts } from '@abx-service-clients/reference-data'

@Tags('deposit')
@Route('/deposits')
export class DepositController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/minimum-amounts')
  public async getMinimumDepositAmounts() {
    return getDepositMimimumAmounts()
  }
}
