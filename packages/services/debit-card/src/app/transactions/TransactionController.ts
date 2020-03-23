import { Controller, Get, Req, Post, HttpCode } from '@nestjs/common'
import { Roles } from '../../shared-components/decorators'
import { CardTransactionView, TransactionRetriever } from '../../shared-components/providers'

@Controller('api/debit-cards/transactions')
export class TransactionController {
  constructor(private readonly transactionRetriever: TransactionRetriever) {}

  @Get()
  @Roles('individual')
  @HttpCode(200)
  getAllCardTransactions(@Req() request: any): Promise<CardTransactionView[]> {
    return this.transactionRetriever.retrieveTransactionsForAccount(request.user.accountId)
  }

  @Post('refresh')
  @Roles('individual')
  @HttpCode(200)
  refreshTransactions(@Req() request: any): Promise<CardTransactionView[]> {
    return this.transactionRetriever.refreshTransactions(request.user.accountId)
  }
}
