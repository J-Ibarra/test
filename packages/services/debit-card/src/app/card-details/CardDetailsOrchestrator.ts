import { Injectable, Inject } from '@nestjs/common'
import { CardRepository, CardOrderRequestRepository } from '../../shared-components/repositories'
import {
  CardProviderFacadeFactory,
  CARD_PROVIDER_FACADE_FACTORY,
  BalanceSourceOfTruthComparator,
  TransactionSourceOfTruthSynchronizer,
} from '../../shared-components/providers'
import { DebitCard, Environment } from '../../shared-components/models'
import { GetPinResponse } from './models/get-pin-response.model'
import { PublicCardView } from './models/public-card-view'
import { TransactionManager, EntityManager } from 'typeorm'
import { OnCardDetailsResponse } from './models/on-card-details.response'

const environmentsWithStubbedCardDetails = [Environment.development, Environment.integration, Environment.uat]

@Injectable()
export class CardDetailsOrchestrator {
  constructor(
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private cardProviderFacadeFactory: CardProviderFacadeFactory,
    private cardRepository: CardRepository,
    private cardOrderRequestRepository: CardOrderRequestRepository,
    @TransactionManager()
    private entityManager: EntityManager,
    private balanceSourceOfTruthComparator: BalanceSourceOfTruthComparator,
    private transactionSourceOfTruthSynchronizer: TransactionSourceOfTruthSynchronizer,
  ) {}

  public async getPin(accountId: string, cvv: string, dob: string): Promise<GetPinResponse> {
    const card: DebitCard = await this.cardRepository.getDebitCardForAccount(accountId)

    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(card.currency)

    const pin = await cardProviderFacade.getPin(card.providerAccountDetails, cvv, dob)
    return { pin }
  }

  public async getFullCardDetails(accountId: string): Promise<PublicCardView | null> {
    const cardDetails = await this.cardRepository.getDebitCardForAccount(accountId, this.entityManager)

    if (!cardDetails) {
      const cardOrderRequest = await this.cardOrderRequestRepository.getLatestOrderRequestForAccount(
        accountId,
        this.entityManager,
      )

      return {
        cardOrdered: !!cardOrderRequest,
      }
    }

    return new PublicCardView(cardDetails)
  }

  public async getOnCardDetails(accountId: string): Promise<OnCardDetailsResponse | null> {
    const card: DebitCard = await this.cardRepository.getDebitCardForAccount(accountId)

    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(card.currency)

    try {
      const result = await cardProviderFacade.getActiveCardDetails(card.providerAccountDetails)

      return (
        result && {
          lastFourDigits: !!result.obscuredCardNumber ? result.obscuredCardNumber.slice(-4) : null,
          displayName: result.cardDisplayName,
        }
      )
    } catch (e) {
      if (environmentsWithStubbedCardDetails.includes(process.env.ENV as Environment)) {
        return {
          lastFourDigits: '1234',
          displayName: 'Teddy Bear',
        }
      }

      throw e
    }
  }

  public async getLatestCardBalance(accountId: string): Promise<number> {
    const card: DebitCard = await this.cardRepository.getDebitCardForAccount(accountId)
    const balance = await this.balanceSourceOfTruthComparator.syncCardBalanceWithSourceOfTruth(card)

    if (balance !== card.balance) {
      process.nextTick(() => this.transactionSourceOfTruthSynchronizer.synchronizeTransactionsWithSource(accountId))
    }

    return balance
  }
}
