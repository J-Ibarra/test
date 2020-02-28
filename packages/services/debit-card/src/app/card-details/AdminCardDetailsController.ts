import { Controller, Get, Param, HttpCode } from '@nestjs/common'
import { CardDetailsOrchestrator } from './CardDetailsOrchestrator'
import { Roles } from '../../shared-components/decorators'
import { PublicCardView } from './models/public-card-view'

@Controller('api/debit-cards/admin')
export class AdminCardDetailsController {
  constructor(private readonly cardDetailsOrchestrator: CardDetailsOrchestrator) {}

  @Get(':accountId')
  @Roles('admin')
  @HttpCode(200)
  getCardDetailsForAccount(@Param('accountId') accountId: string): Promise<PublicCardView | null> {
    return this.cardDetailsOrchestrator.getFullCardDetails(accountId)
  }
}
