import { Body, Controller, Post, Req, HttpCode } from '@nestjs/common'
import { ApiImplicitBody } from '@nestjs/swagger'

import { CardNumberValidatorRequest } from './models/card-number-validator-request.model'
import { Roles } from '../../shared-components/decorators'
import { CardNumberValidator } from './CardNumberValidator'
import { CardNumberValidatorResponse } from './models/card-number-validator-response.model'

@Controller('api/debit-cards/number')
export class CardNumberValidatorController {
  constructor(private readonly cardNumberValidator: CardNumberValidator) {}

  @Post('validation')
  @ApiImplicitBody({ name: 'CardNumberValidatorRequest', type: CardNumberValidatorRequest })
  @Roles('individual')
  @HttpCode(200)
  orderDebitCard(
    @Body() { lastFourDigits, cvv, dateOfBirth }: CardNumberValidatorRequest,
    @Req() request: any,
  ): Promise<CardNumberValidatorResponse> {
    return this.cardNumberValidator.validateLastFourDigits(request.user.accountId, lastFourDigits, cvv, dateOfBirth)
  }
}
