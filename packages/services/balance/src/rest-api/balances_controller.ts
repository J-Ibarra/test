import { Controller, Get, Request, Route, Security } from 'tsoa'

import { CompleteBalanceDetails } from '@abx-types/balance'
import { Logger } from '@abx/logging'
import { getApiCacheClient } from '@abx/db-connection-utils'
import { OverloadedRequest } from '@abx-types/account'
import { BalanceRetrievalFacade } from '../core/balance_retrieval_facade'

@Route('balances')
export class BalancesController extends Controller {
  private logger = Logger.getInstance('api', 'BalancesController')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get()
  public async getAllBalancesForAccount(@Request() request: OverloadedRequest) {
    this.logger.debug(`Retrieving balance for ${request.account!.id}`)

    const cachedResponse = await getApiCacheClient().getCache<CompleteBalanceDetails>(`balances-account-${request.account!.id}`)

    if (cachedResponse) {
      return cachedResponse
    }

    return BalanceRetrievalFacade.getInstance().findAllBalancesForAccount(request.account!.id)
  }
}
