import { Controller, Get, Query, Request, Route, Security } from 'tsoa'

import { getTradeTransactionInvoicePreSignedUrl } from '../../../packages/reports'
import { TradeTransactionInvoiceUrl } from '../../../packages/reports/interfaces'
import { OverloadedRequest } from '../middleware/request_overloads'

@Route('reports')
export class ReportsController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/trade-transaction-invoice')
  public async fetchTradeTransactionReport(
    @Request() request: OverloadedRequest,
    @Query() transactionId: number
  ) {
    const { account: { id: accountId } } = request
    try {
      const url = await getTradeTransactionInvoicePreSignedUrl(accountId, transactionId)
      return url
    } catch (err) {
      this.setStatus(err.status || 400)
      return { message: err.message as string }
    }
  }
}
