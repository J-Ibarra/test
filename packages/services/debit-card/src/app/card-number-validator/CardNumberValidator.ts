import { Injectable, Logger, Inject } from '@nestjs/common'
import { CardRepository } from '../../shared-components/repositories'
import { CardProviderFacadeFactory, CARD_PROVIDER_FACADE_FACTORY, CardProviderFacade } from '../../shared-components/providers'
import { DebitCard, DebitCardStatus, ProviderAccountDetails } from '../../shared-components/models'
import { CardNumberValidatorResponse } from './models/card-number-validator-response.model'
import { CardActivationAttemptValidator } from './CardActivationAttemptValidatior'

@Injectable()
export class CardNumberValidator {
  private logger = new Logger('CardNumberValidator')

  constructor(
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private cardProviderFacadeFactory: CardProviderFacadeFactory,
    private cardRepository: CardRepository,
    private cardActivationAttemptValidator: CardActivationAttemptValidator,
  ) {}

  async validateLastFourDigits(
    accountId: string,
    lastFourDigits: string,
    cvv: string,
    dateOfBirth: string,
  ): Promise<CardNumberValidatorResponse> {
    this.logger.debug(`Validating last four digits of card number for account ${accountId}`)
    const card: DebitCard = await this.cardRepository.getDebitCardForAccount(accountId)

    if (!card) {
      this.logger.error(`Card not found for account ${accountId}`)

      throw Error(`Unable to find a card with accountId: ${accountId}`)
    }

    const {
      attemptsExceeded,
      lastActivationAttempt,
    } = await this.cardActivationAttemptValidator.maximumDailyActivationAttemptsExceeded(card)

    if (attemptsExceeded) {
      return {
        valid: false,
        activationAttemptValidationFailure: {
          allowedAttempts: CardActivationAttemptValidator.MAXIMUM_ALLOWED_ACTIVATION_ATTEMPTS,
          lastAttempt: lastActivationAttempt,
        },
      }
    }

    const lastFourDigitsValid = await this.areLastFourDigitsValid(card, lastFourDigits)

    if (lastFourDigitsValid) {
      return this.activateCard(card, cvv, dateOfBirth)
    } else {
      return {
        valid: lastFourDigitsValid,
      }
    }
  }

  private async areLastFourDigitsValid(card: DebitCard, lastFourDigits: string): Promise<boolean> {
    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(card.currency)

    try {
      const result = await cardProviderFacade.validateLastFourDigits(card.providerAccountDetails, lastFourDigits)

      return result.valid
    } catch (e) {
      this.logger.error(`Error ocurred trying to validate card last four digits for card ${card.id!}`)
      this.logger.error(JSON.stringify(e))
      return false
    }
  }

  private async activateCard(card: DebitCard, cvv: string, dateOfBirth: string) {
    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(card.currency)
    const updatedProviderDetails = await this.getLatestCardDetails(cardProviderFacade, card)

    try {
      await this.cardRepository.updateCardStatus(updatedProviderDetails, DebitCardStatus.active)
      const updatedCard = await this.cardRepository.getDebitCardForAccount(card.accountId)

      await cardProviderFacade.activateCard(updatedProviderDetails, cvv, dateOfBirth)

      return {
        valid: true,
        card: {
          currency: updatedCard.currency,
          status: updatedCard.status,
          balance: updatedCard.balance,
        },
      }
    } catch (e) {
      return {
        valid: true,
        activationAttemptValidationFailure: {
          allowedAttempts: CardActivationAttemptValidator.MAXIMUM_ALLOWED_ACTIVATION_ATTEMPTS,
          lastAttempt: new Date(),
        },
      }
    }
  }

  private async getLatestCardDetails(cardProviderFacade: CardProviderFacade, card: DebitCard): Promise<ProviderAccountDetails> {
    const latestCardDetails = await cardProviderFacade.getLatestCardDetails(card.providerAccountDetails)
    let updatedProviderDetails = card.providerAccountDetails

    if (latestCardDetails!.id !== card.getCardId()) {
      updatedProviderDetails = {
        ...card.providerAccountDetails,
        cardId: latestCardDetails!.id,
      } as any

      await this.cardRepository.updateCardWhereProviderDetailsMatch(card.providerAccountDetails, {
        providerAccountDetails: updatedProviderDetails,
      })
    }

    return updatedProviderDetails
  }
}
