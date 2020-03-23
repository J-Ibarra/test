import util from 'util'

import { Body, Controller, Post, Req, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { ApiImplicitBody } from '@nestjs/swagger'
import { Roles } from '../../shared-components/decorators'
import { WithdrawalOrchestrator } from './WithdrawalOrchestrator'
import { WithdrawalRequest } from './models/withdrawal-request.model'
import { WithdrawalResponse } from './models/withdrawal-response.model'

@Controller('api/debit-cards/withdrawals')
export class WithdrawalController {
  private logger = new Logger('WithdrawalController')

  constructor(private readonly withdrawalOrchestrator: WithdrawalOrchestrator) {}

  @Post()
  @ApiImplicitBody({ name: 'WithdrawalRequest', type: WithdrawalRequest })
  @Roles('individual')
  async withdraw(@Body() { amount }: WithdrawalRequest, @Req() request: any): Promise<WithdrawalResponse | undefined> {
    try {
      const result = await this.withdrawalOrchestrator.withdrawFundsToExchange(request.user.accountId, amount)

      return result
    } catch (error) {
      this.logger.error(`Error ocurred trying to withdraw from debit card for account ${request.user.accountId}`)
      this.logger.error(JSON.stringify(util.inspect(error)))

      if (!!error.status) {
        throw new HttpException(error.message, error.status)
      }

      throw new HttpException('An error has ocurred processing your request', HttpStatus.BAD_REQUEST)
    }
  }
}
