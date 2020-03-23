/* tslint:disable max-line-length */
import { Logger, Injectable, Inject } from '@nestjs/common'
import { DebitCard, DebitCardStatus } from '../../shared-components/models'
import {
  CardProviderFacadeFactory,
  CARD_PROVIDER_FACADE_FACTORY,
} from '../../shared-components/providers/debit-card-provider/CardProviderFacadeFactory'
import { CardRepository } from '../../shared-components/repositories/CardRepository'
/* tslint:enable max-line-length */

@Injectable()
export class AdminCardStatusChangeOrchestrator {
  private logger = new Logger('AdminCardStatusChangeOrchestrator')

  constructor(
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private cardProviderFacadeFactory: CardProviderFacadeFactory,
    private cardRepository: CardRepository,
  ) {}

  /**
   * Action triggered by a system administrator to suspend the debit card for a specific account.
   *
   * @param accountId the id of the account which card should be marked as lost
   * @param entityManager allows for a parent entityManager to be passed in, propagating a parent transaction
   */
  async changeAccountCardStatusToSuspended(accountId: string): Promise<void> {
    const debitCard: DebitCard = await this.cardRepository.getDebitCardForAccount(accountId)
    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(debitCard.currency)

    this.logger.log(`Attempting to set debit card as lost for ${accountId} using ${cardProviderFacade.getProvider()}`)

    await cardProviderFacade.suspendAccount(debitCard.providerAccountDetails)
    await this.cardRepository.updateCardStatus(debitCard.providerAccountDetails, DebitCardStatus.suspended)
  }

  /**
   * Action triggered by a system administrator to reactivate the debit card for a specific account.
   *
   * @param accountId the id of the account which card should be marked as lost
   * @param entityManager allows for a parent entityManager to be passed in, propagating a parent transaction
   */
  async putSuspendedAccountCardBackToNormal(accountId: string): Promise<void> {
    const debitCard: DebitCard = await this.cardRepository.getDebitCardForAccount(accountId)
    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(debitCard.currency)

    this.logger.log(`Attempting to set debit card as active for ${accountId} using ${cardProviderFacade.getProvider()}`)

    await cardProviderFacade.setAccountBackToNormal(debitCard.providerAccountDetails)
    await this.cardRepository.updateCardStatus(debitCard.providerAccountDetails, DebitCardStatus.active)
  }
}
