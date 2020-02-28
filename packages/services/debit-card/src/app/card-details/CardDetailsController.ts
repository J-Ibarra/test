import { Controller, Req, Get, Query } from '@nestjs/common'
import { CardDetailsOrchestrator } from './CardDetailsOrchestrator'
import { GetLastFourDigitsResponse } from './models/get-last-four-digits-response'
import { GetPinResponse } from './models/get-pin-response.model'
import { Roles } from '../../shared-components/decorators'
import { PublicCardView } from './models/public-card-view'
import { CardConstraintService } from '../../shared-components/providers/contraints/CardContraint.service'
import { CardConstraintName } from '../../shared-components/models/config/CardConstraint.entity'
import { OnCardDetailsResponse } from './models/on-card-details.response'
import { LatestCardBalanceResponse } from './models/card-balance.response'

@Controller('api/debit-cards')
export class CardDetailsController {
  constructor(
    private readonly cardDetailsOrchestrator: CardDetailsOrchestrator,
    private readonly cardConstraintsService: CardConstraintService,
  ) {}

  @Get()
  @Roles('individual')
  getCardDetailsForAccount(@Req() request: any): Promise<PublicCardView | null> {
    return this.cardDetailsOrchestrator.getFullCardDetails(request.user.accountId)
  }

  @Get('pin')
  @Roles('individual')
  getPin(@Query('cvv') cvv: string, @Query('dob') dob: string, @Req() request: any): Promise<GetPinResponse> {
    return this.cardDetailsOrchestrator.getPin(request.user.accountId, cvv, dob)
  }

  @Get('number')
  @Roles('individual')
  async getLastFourDigits(@Req() request: any): Promise<GetLastFourDigitsResponse> {
    const onCardDetails = await this.cardDetailsOrchestrator.getOnCardDetails(request.user.accountId)

    return {
      lastFourDigits: (onCardDetails && onCardDetails.lastFourDigits) || '',
    }
  }

  @Get('on-card-details')
  @Roles('individual')
  onCardDetails(@Req() request: any): Promise<OnCardDetailsResponse | null> {
    return this.cardDetailsOrchestrator.getOnCardDetails(request.user.accountId)
  }

  @Get('constraints')
  @Roles('individual')
  getCardConstraints(): Record<CardConstraintName, string | number> {
    return this.cardConstraintsService.getAllCardConstraints()
  }

  @Get('balance')
  @Roles('individual')
  async getLatestCardBalance(@Req() request: any): Promise<LatestCardBalanceResponse> {
    const latestBalance = await this.cardDetailsOrchestrator.getLatestCardBalance(request.user.accountId)

    return {
      balance: latestBalance,
    }
  }
}
