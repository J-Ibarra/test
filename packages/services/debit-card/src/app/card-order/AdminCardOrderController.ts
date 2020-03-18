import { Body, Controller, Post, HttpCode } from '@nestjs/common'
import { ApiImplicitBody } from '@nestjs/swagger'

import { CardOrderGateway } from './CardOrderGateway'
import { Roles } from '../../shared-components/decorators'
import { AllowAnotherApplicationForAccountRequest } from './models/card-order-allow-reorder.model'

@Controller('api/debit-cards/admin/order/second-attempt')
export class AdminCardOrderController {
  constructor(private readonly cardOrderGateway: CardOrderGateway) {}

  @Post()
  @ApiImplicitBody({ name: 'AllowAnotherApplicationForAccountRequest', type: AllowAnotherApplicationForAccountRequest })
  @Roles('admin')
  @HttpCode(200)
  allowCardApplicationForAccount(@Body()
  {
    accountId,
  }: AllowAnotherApplicationForAccountRequest): Promise<void> {
    return this.cardOrderGateway.allowDebitCardOrderForAccount(accountId)
  }
}
