import { Body, Controller, Post, Req, Get, Param } from '@nestjs/common'
import { ApiImplicitBody } from '@nestjs/swagger'
import { Roles } from '../../shared-components/decorators'
import { TopUpRecorder } from './TopUpRecorder'
import { TopUpDebitCardRequest } from './models/top-up-debit-card-request.model'
import { TopUpDebitCardResponse } from './models/top-up-debit-card-response.model'
import { TopUpRequest } from '../../shared-components/models'

@Controller('api/debit-cards/top-ups')
export class TopUpController {
  constructor(private readonly topUpRecorder: TopUpRecorder) {}

  @Post()
  @ApiImplicitBody({ name: 'TopUpDebitCardRequest', type: TopUpDebitCardRequest })
  @Roles('individual')
  topUpDebitCard(
    @Body() { amount, currency }: TopUpDebitCardRequest,
    @Req() request: any,
  ): Promise<TopUpDebitCardResponse | undefined> {
    return this.topUpRecorder.recordTopUpRequest(amount, currency, request.user.accountId)
  }

  @Get(':id')
  @Roles('individual')
  getTopUpRequest(@Param('id') id: number): Promise<TopUpRequest> {
    return this.topUpRecorder.getTopUpRequest(id)
  }
}
