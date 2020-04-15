import { Controller, Get, Request, Route, Security, Tags } from 'tsoa'

import { Logger } from '@abx-utils/logging'
import { OverloadedRequest } from '@abx-types/account'
import { getAccountTransactionHistory } from '../core/history'
import { CurrencyCode } from '@abx-types/reference-data'

@Tags('order')
@Route('transaction-history')
export class TransactionHistoryController extends Controller {
  private logger = Logger.getInstance('api', 'TransactionHistoryController')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/{selectedCurrency}')
  public async getTransactionHistoryForCurrency(selectedCurrency: CurrencyCode, @Request() request: OverloadedRequest) {
    try {
      const transactionHistoryItems = await getAccountTransactionHistory(request.account!.id, selectedCurrency)
      return transactionHistoryItems
    } catch (error) {
      this.setStatus(error.status || 400)
      this.logger.error(`Retrieving history for currency: ${selectedCurrency} errors: ${error.status || 400} - ${error.message}`)
      this.logger.error(`${JSON.stringify(error)}`)

      return {
        message: error.message as string,
      }
    }
  }
}
