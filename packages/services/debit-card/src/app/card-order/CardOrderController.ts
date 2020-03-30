import { Body, Controller, Post, Req } from '@nestjs/common'
import { ApiImplicitBody } from '@nestjs/swagger'

import { CardOrderGateway } from './CardOrderGateway'
import { OrderCardRequest } from './models/order-card-request.model'
import { Roles } from '../../shared-components/decorators'

@Controller('api/debit-cards')
export class CardOrderController {
  constructor(private readonly cardOrderGateway: CardOrderGateway) {}

  @Post()
  @ApiImplicitBody({ name: 'OrderCardRequest', type: OrderCardRequest })
  @Roles('individual')
  orderDebitCard(
    @Body()
    { cardCurrency, presentAddress }: OrderCardRequest,
    @Req() request: any,
  ): Promise<void> {
    return this.cardOrderGateway.orderDebitCard(request.user.accountId, cardCurrency, presentAddress)
  }
}
