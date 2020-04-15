import { Controller, Get, Query, Request, Route, Security, Tags } from 'tsoa'
import { OverloadedRequest } from '@abx-types/account'
import { getTradeTransactionInvoicePreSignedUrl } from '../core'

@Tags('reports')
@Route('reports')
export class ReportsController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/trade-transaction-invoice')
  public async fetchTradeTransactionReport(@Request() request: OverloadedRequest, @Query() transactionId: number) {
    const { account } = request
    try {
      const url = await getTradeTransactionInvoicePreSignedUrl(account!.id, transactionId)
      return url
    } catch (err) {
      this.setStatus(err.status || 400)
      return { message: err.message as string }
    }
  }
}
