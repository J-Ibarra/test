import { Controller, Get, Request, Route, Security } from 'tsoa'

import { Logger } from '@abx/logging'
import { OverloadedRequest } from '@abx-types/account'

@Route('transaction-history')
export class TransactionHistoryController extends Controller {
  private logger = Logger.getInstance('api', 'TransactionHistoryController')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/{selectedCurrency}')
  public async getTransactionHistoryForCurrency(selectedCurrency: string, @Request() request: OverloadedRequest) {
    try {
      const transactionHistoryItems = await epicurus.request(EpicurusRequestChannel.getTransactionHistory, {
        accountId: request.account.id,
        selectedCurrency,
      })
      return transactionHistoryItems
    } catch (error) {
      this.setStatus(error.status || 400)
      this.logger.error(`Retrieving history for currency: ${selectedCurrency} errors: ${error.status || 400} - ${error.message}`)
      return {
        message: error.message as string,
      }
    }
  }
}
