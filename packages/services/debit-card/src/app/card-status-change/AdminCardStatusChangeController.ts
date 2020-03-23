import { Controller, Post, Delete, Param, HttpCode } from '@nestjs/common'
import { AdminCardStatusChangeOrchestrator } from './AdminCardStatusChangeOrchestrator'
import { CardStatusChangeOrchestrator } from './CardStatusChangeOrchestrator'
import { Roles } from '../../shared-components/decorators'

@Controller('api/debit-cards/admin')
export class AdminCardStatusChangeController {
  constructor(
    private readonly adminCardStatusChangeOrchestrator: AdminCardStatusChangeOrchestrator,
    private readonly cardStatusChangeOrchestrator: CardStatusChangeOrchestrator,
  ) {}

  @Post(':accountId/suspension')
  @Roles('admin')
  @HttpCode(200)
  suspendAccount(@Param('accountId') accountId: string): Promise<void> {
    return this.adminCardStatusChangeOrchestrator.changeAccountCardStatusToSuspended(accountId)
  }

  @Delete(':accountId/suspension')
  @Roles('admin')
  @HttpCode(200)
  changeAccountStateToNormal(@Param('accountId') accountId: string): Promise<void> {
    return this.adminCardStatusChangeOrchestrator.putSuspendedAccountCardBackToNormal(accountId)
  }

  @Post(':accountId/replacement/damaged')
  @Roles('admin')
  @HttpCode(200)
  flagCardAsDamagedAndIssueNewOne(@Param('accountId') accountId: string): Promise<void> {
    return this.cardStatusChangeOrchestrator.changeCardStatusToDamagedWithReplacement(accountId)
  }

  @Post(':accountId/replacement/lost')
  @Roles('admin')
  @HttpCode(200)
  flagCardAsLostAndIssueNewOne(@Param('accountId') accountId: string): Promise<void> {
    return this.cardStatusChangeOrchestrator.changeCardStatusToLostWithReplacement(accountId)
  }
}
