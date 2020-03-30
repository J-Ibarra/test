import { Injectable, Logger, Inject } from '@nestjs/common'
import { CardOrderRequestRepository } from '../../shared-components/repositories/CardOrderRequestRepository'
import { ExchangeUserDetailsFacade, USER_DETAILS_FACADE_TOKEN } from '../../shared-components/providers'
import { UserStatus, CardOrderRequestStatus, CompleteAccountDetails, CurrencyCode, Address } from '../../shared-components/models'
import { CardOrderOrchestrator } from './CardOrderOrchestrator'

@Injectable()
export class CardOrderGateway {
  private logger = new Logger('CardOrderGateway')

  constructor(
    private cardOrderRequestRepository: CardOrderRequestRepository,
    @Inject(USER_DETAILS_FACADE_TOKEN)
    private userDetailsFacade: ExchangeUserDetailsFacade,
    private cardOrderOrchestrator: CardOrderOrchestrator,
  ) {}

  async orderDebitCard(accountId: string, currency: CurrencyCode, presentAddress: Address): Promise<void> {
    await this.checkForExistingFailedOrderRequest(accountId)
    this.logger.debug(`No pre-existing debit-card order found for ${accountId}`)

    const userDetails = await this.userDetailsFacade.getFullAccountDetails(accountId)

    this.logger.log(`User details retrieved for ${accountId}: ${JSON.stringify(userDetails)}`)

    await this.saveCardOrderRequest(accountId, currency, userDetails, presentAddress)
  }

  async allowDebitCardOrderForAccount(accountId: string): Promise<void> {
    const cardOrderRequest = await this.cardOrderRequestRepository.getLatestOrderRequestForAccount(accountId)

    await this.cardOrderRequestRepository.updateOrderRequestStatus(
      accountId,
      cardOrderRequest.currency,
      CardOrderRequestStatus.adminApplicationAllowed,
    )
  }

  private async saveCardOrderRequest(
    accountId: string,
    currency: CurrencyCode,
    userDetails: CompleteAccountDetails,
    presentAddress: Address,
  ): Promise<any> {
    if (userDetails.status !== UserStatus.kycVerified) {
      this.logger.debug(`Account ${accountId} has not yet been KYC verified. Debit card order postponed`)
      return this.cardOrderRequestRepository.saveCardOrderRequest(
        accountId,
        currency,
        CardOrderRequestStatus.kycPending,
        presentAddress,
      )
    }

    await this.cardOrderRequestRepository.saveCardOrderRequest(
      accountId,
      currency,
      CardOrderRequestStatus.orderPending,
      presentAddress,
    )

    return this.cardOrderOrchestrator.orderDebitCardForUser(userDetails, currency, presentAddress)
  }

  private async checkForExistingFailedOrderRequest(accountId: string): Promise<void> {
    const cardOrderRequest = await this.cardOrderRequestRepository.getLatestOrderRequestForAccount(accountId)

    if (!!cardOrderRequest && cardOrderRequest.status !== CardOrderRequestStatus.adminApplicationAllowed) {
      this.logger.debug(`Existing order request for account ${accountId}. Current card request will be not be handled.`)
      throw Error('The order request has been already made')
    }
  }
}
