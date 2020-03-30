import { Controller, Post, Req } from '@nestjs/common'
import { Roles } from '../../shared-components/decorators'
import { CardLockingService } from './CardLockingService'

@Controller('api/debit-cards/lock')
export class CardLockingController {
  constructor(private readonly debitCardLockingService: CardLockingService) {}

  @Post()
  @Roles('individual')
  lockDebitCard(@Req() request: any): Promise<void> {
    return this.debitCardLockingService.lockCard(request.user.accountId)
  }
}
