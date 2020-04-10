import { Controller, Get, Query, Request, Route, Security, Tags } from 'tsoa'

import { buildAccountMonthlyTradeSummary, findTradeTransactions, findCurrencyTransactions } from '../../../core'
import { OverloadedRequest } from '@abx-types/account'
import { AccountMonthlyTradeSummary, TransactionType, TradeTransaction, CurrencyTransaction } from '@abx-types/order'

@Tags('order')
@Route('transactions')
export class TransactionsController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('monthly-summary')
  public async getAccountMonthlyTradeSummary(@Request() { account }: OverloadedRequest): Promise<AccountMonthlyTradeSummary> {
    return buildAccountMonthlyTradeSummary(account!.id!)
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get()
  public async getTransactions(
    @Request() request: OverloadedRequest,
    @Query() type: TransactionType,
    @Query() limit?: number,
    @Query() offset?: number,
  ): Promise<TradeTransaction[] | CurrencyTransaction[]> {
    const query = {
      where: {
        accountId: request.account!.id,
      },
      limit,
      offset,
    }

    const { rows } = await (type === TransactionType.trade ? findTradeTransactions(query) : findCurrencyTransactions(query))

    return rows
  }
}
