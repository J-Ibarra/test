import { Controller, Post, Req, Logger, HttpException, HttpStatus, HttpCode } from '@nestjs/common'
import { Roles } from '../../shared-components/decorators'
import { CardStatusChangeOrchestrator } from './CardStatusChangeOrchestrator'

@Controller('api/debit-cards')
export class CardStatusChangeController {
  private logger = new Logger('CardStatusChangeController')

  constructor(private readonly cardStatusChangeOrchestrator: CardStatusChangeOrchestrator) {}

  @Post('lost')
  @Roles('individual')
  @HttpCode(200)
  changeCardStatusToLostWithReplacement(@Req() request: any): Promise<void> {
    try {
      return this.cardStatusChangeOrchestrator.changeCardStatusToLostWithReplacement(request.user.accountId)
    } catch (e) {
      this.logger.error(`Error ocurred trying to mark debit card as lost for ${request.user.accountId}`)
      this.logger.error(JSON.stringify(e))

      throw new HttpException('An error has ocurred processing your request', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('damaged')
  @Roles('individual')
  @HttpCode(200)
  changeCardStatusToDamagedWithReplacement(@Req() request: any): Promise<void> {
    try {
      return this.cardStatusChangeOrchestrator.changeCardStatusToDamagedWithReplacement(request.user.accountId)
    } catch (e) {
      this.logger.error(`Error ocurred trying to mark debit card as damaged for ${request.user.accountId}`)
      this.logger.error(JSON.stringify(e))

      throw new HttpException('An error has ocurred processing your request', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
