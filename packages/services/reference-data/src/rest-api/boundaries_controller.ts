import { Controller, Get, Request, Route, Tags } from 'tsoa'
import { findAllBoundaries } from '../core/find_boundaries'
import { OverloadedRequest } from '@abx-types/account'
import { findCurrenciesByAccountId } from '../core'

@Tags('reference-data')
@Route('/boundaries')
export class BoundariesController extends Controller {
  @Get()
  public async findAllBoundaries(@Request() request: OverloadedRequest) {
    const allowedCurrencies = await findCurrenciesByAccountId(request.account!.id)
    const currencyCodes = allowedCurrencies.map(c => c.code)
    return findAllBoundaries(currencyCodes)
  }
}
