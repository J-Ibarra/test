/* tslint:disable max-line-length */
import { EntityManager } from 'typeorm'
import { Logger, Injectable, Inject } from '@nestjs/common'
import { DebitCard, ContisAccountDetails, DebitCardStatus } from '../../shared-components/models'
import {
  CardProviderFacadeFactory,
  CARD_PROVIDER_FACADE_FACTORY,
} from '../../shared-components/providers/debit-card-provider/CardProviderFacadeFactory'
import { CardRepository } from '../../shared-components/repositories/CardRepository'
/* tslint:enable max-line-length */

@Injectable()
export class CardStatusChangeOrchestrator {
  private logger = new Logger('CardStatusChangeOrchestrator')

  constructor(
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private cardProviderFacadeFactory: CardProviderFacadeFactory,
    private cardRepository: CardRepository,
  ) {}

  /**
   * Handles the workflow of marking the debit card of the user as lost.
   * After the debit card is marked as such, a new one is issued.
   *
   * @param accountId the id of the account which card should be marked as lost
   * @param entityManager allows for a parent entityManager to be passed in, propagating a parent transaction
   */
  async changeCardStatusToLostWithReplacement(accountId: string, entityManager?: EntityManager): Promise<void> {
    const debitCard: DebitCard = await this.cardRepository.getDebitCardForAccount(accountId, entityManager)

    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(debitCard.currency)

    this.logger.debug(`Attempting to set debit card as lost for ${accountId} using ${cardProviderFacade.getProvider()}`)

    await cardProviderFacade.setCardAsLostWithReplacement(debitCard.providerAccountDetails)
    await this.cardRepository.updateCardStatus(debitCard.providerAccountDetails, DebitCardStatus.lost)
    this.logger.log(`Debit card set as lost for ${accountId} using ${cardProviderFacade.getProvider()}`)
  }

  /**
   * Handles the workflow of marking the debit card of the user as damaged.
   * After the debit card is marked as such, a new one is issued.
   *
   * @param accountId the id of the account which card should be marked as damaged
   * @param entityManager allows for a parent entityManager to be passed in, propagating a parent transaction
   */
  async changeCardStatusToDamagedWithReplacement(accountId: string, entityManager?: EntityManager): Promise<void> {
    const debitCard: DebitCard = await this.cardRepository.getDebitCardForAccount(accountId, entityManager)

    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(debitCard.currency)

    this.logger.debug(`Attempting to set debit card as damaged for ${accountId} using ${cardProviderFacade.getProvider()}`)

    await cardProviderFacade.setCardAsDamaged(debitCard.providerAccountDetails as ContisAccountDetails)
    await this.cardRepository.updateCardStatus(debitCard.providerAccountDetails, DebitCardStatus.damaged)
    this.logger.log(`Debit card set as damaged for ${accountId} using ${cardProviderFacade.getProvider()}`)
  }
}
