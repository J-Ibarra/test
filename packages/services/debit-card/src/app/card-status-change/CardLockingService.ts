import { EntityManager } from 'typeorm'
import { Logger, Injectable, Inject } from '@nestjs/common'
import { CardRepository } from '../../shared-components/repositories'
import { CardProviderFacadeFactory, CARD_PROVIDER_FACADE_FACTORY } from '../../shared-components/providers'
import { DebitCard } from '../../shared-components/models'
import { DebitCardStatus } from '../../shared-components/models/card/DebitCardStatus.enum'

@Injectable()
export class CardLockingService {
  private logger = new Logger('CardLockingService')

  constructor(
    private cardRepository: CardRepository,
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private cardProviderFacadeFactory: CardProviderFacadeFactory,
  ) {}

  /**
   * Handles the workflow of locking a debit card of an account.
   *
   * @param accountId the id of the account of the debit card to be locked
   * @param entityManager allows for a parent entityManager to be passed in, propagating a parent transaction
   */
  async lockCard(accountId: string, entityManager?: EntityManager): Promise<void> {
    try {
      const debitCard: DebitCard = await this.cardRepository.getDebitCardForAccount(accountId, entityManager)
      const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(debitCard.currency)

      this.logger.log(`Attempting debit card locking for ${accountId} using ${cardProviderFacade.getProvider()}`)

      await cardProviderFacade.lockCard(debitCard.providerAccountDetails)

      await this.cardRepository.updateCardStatus(
        debitCard.providerAccountDetails,
        DebitCardStatus.lockedOut,
        entityManager,
      )
    } catch (e) {
      this.logger.error(`Error occured trying to lock debit card for ${accountId}`)
      this.logger.error(JSON.stringify(e))
    }
  }
}
