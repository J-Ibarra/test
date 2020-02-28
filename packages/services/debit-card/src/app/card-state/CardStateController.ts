import { Controller, Post, Req } from '@nestjs/common'
import { Roles } from '../../shared-components/decorators'
import { CardStateService } from './CardStateService'

@Controller('api/debit-cards/state')
export class CardStateController {
  constructor(private readonly cardStateService: CardStateService) {}

  @Post('lock')
  @Roles('individual')
  lockCard(@Req() request: any): Promise<void> {
    return this.cardStateService.lockCard(request.user.accountId)
  }

  @Post('normal')
  @Roles('individual')
  unlockCard(@Req() request: any): Promise<void> {
    return this.cardStateService.unlockCard(request.user.accountId)
  }
}
