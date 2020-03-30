import { Controller, Get, Param, HttpCode } from '@nestjs/common'
import { Roles } from '../../shared-components/decorators'
import { CardTransactionView, TransactionRetriever } from '../../shared-components/providers'

@Controller('api/debit-cards/admin/transactions')
export class AdminTransactionController {
  constructor(private readonly transactionRetriever: TransactionRetriever) {}

  @Get(':accountId')
  @Roles('admin')
  @HttpCode(200)
  getAllCardTransactions(@Param('accountId') accountId: string): Promise<CardTransactionView[]> {
    return this.transactionRetriever.retrieveTransactionsForAccount(accountId)
  }
}
