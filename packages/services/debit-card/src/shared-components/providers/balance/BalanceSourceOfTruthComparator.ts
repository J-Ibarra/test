import { Injectable, Inject } from '@nestjs/common'
import { DebitCard } from '../../models'
import { CardProviderFacadeFactory, CARD_PROVIDER_FACADE_FACTORY } from '../debit-card-provider'
import { CardRepository } from '../../repositories'
import { EntityManager } from 'typeorm'

/**
 * This is a mechanism for comparing the balance for a card
 * (stored locally in the service database) to the actual
 * balance from the debit card provider (the source of truth).
 */
@Injectable()
export class BalanceSourceOfTruthComparator {
  constructor(
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private cardProviderFacadeFactory: CardProviderFacadeFactory,
    private cardRepository: CardRepository,
  ) {}

  public async syncCardBalanceWithSourceOfTruth(card: DebitCard, entityManager?: EntityManager): Promise<number> {
    const cardProvider = this.cardProviderFacadeFactory.getCardProvider(card.currency)
    const sourceOfTruthAccountBalance = await cardProvider.getAccountBalance(card.providerAccountDetails)

    if (card.balance !== sourceOfTruthAccountBalance) {
      await this.cardRepository.updateCardBalance(card.id, sourceOfTruthAccountBalance, entityManager)
    }

    return Promise.resolve(sourceOfTruthAccountBalance)
  }
}
