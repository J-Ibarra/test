import { Body, Controller, Post, Delete, Patch } from '@nestjs/common'

import { SetupCardRequest, SetupCardOrderRequest } from './requests'
import { E2ETestSetupService } from './E2ETestSetupService'
import { CardStatusChangeRequest } from './requests/card-status-change.model'
import { CardTransactionInsertRequest } from './requests/card-transaction-insert.model'

@Controller('api/debit-cards/e2e-testing')
export class E2ETestSetupController {
  constructor(private readonly e2ETestSetupService: E2ETestSetupService) {}

  @Delete('reset-data')
  resetData(): Promise<void> {
    return this.e2ETestSetupService.resetData()
  }

  @Post('setup')
  setupCard(@Body() { email, currency, provider, balance, transactions, status }: SetupCardRequest): Promise<void> {
    return this.e2ETestSetupService.setupCard(email, currency, provider, balance, transactions, status)
  }

  @Post('setup-request')
  setupCardRequest(@Body() { email, currency, status }: SetupCardOrderRequest): Promise<void> {
    return this.e2ETestSetupService.setupCardRequest(email, currency, status)
  }

  @Patch('card-status')
  changeCardStatus(@Body() { email, status }: CardStatusChangeRequest): Promise<void> {
    return this.e2ETestSetupService.updateCardStatus(email, status)
  }

  @Post('card-transactions')
  addCardTransactions(@Body() { email, transactions }: CardTransactionInsertRequest): Promise<void> {
    return this.e2ETestSetupService.insertTransactions(email, transactions)
  }
}
