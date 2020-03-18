/* tslint:disable max-line-length */
import { TransactionManager, EntityManager } from 'typeorm'
import { Logger, Injectable, Inject } from '@nestjs/common'
import {
  CurrencyCode,
  CompleteAccountDetails,
  CardOrderRequestStatus,
  DebitCardProvider,
  ProviderAccountDetails,
  Address,
} from '../../shared-components/models'
import {
  CardProviderFacadeFactory,
  CARD_PROVIDER_FACADE_FACTORY,
} from '../../shared-components/providers/debit-card-provider/CardProviderFacadeFactory'
import { CardRepository } from '../../shared-components/repositories/CardRepository'
import { CardOrderRequestRepository } from '../../shared-components/repositories'
import { CONFIG_SOURCE_TOKEN, ConfigSource } from '../../shared-components/providers'
/* tslint:enable max-line-length */

@Injectable()
export class CardOrderOrchestrator {
  private logger = new Logger('CardOrderOrchestrator')

  constructor(
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private cardProviderFacadeFactory: CardProviderFacadeFactory,
    private cardRepository: CardRepository,
    private cardOrderRequestRepository: CardOrderRequestRepository,
    @TransactionManager()
    private entityManager: EntityManager,
    @Inject(CONFIG_SOURCE_TOKEN) private configSource: ConfigSource,
  ) {}

  /**
   * Handles the workflow of debit card creation which depends on the provider used.
   * After the debit card (user account) is created for a give provider, we update the order request
   * to order_completed and create an available balance for the card.
   *
   * @param accountDetails the debit card holder details
   * @param cardCurrency the currency to use for the debit card
   * @param presentAddress the present address for the user
   * @param entityManager allows for a parent entityManager to be passed in, propagating a parent transaction
   */
  async orderDebitCardForUser(
    accountDetails: CompleteAccountDetails,
    cardCurrency: CurrencyCode,
    presentAddress: Address,
    entityManager?: EntityManager,
  ): Promise<void> {
    if (entityManager) {
      return this.orderCard(accountDetails, cardCurrency, presentAddress, entityManager)
    } else {
      return await this.entityManager.transaction(async manager => {
        return this.orderCard(accountDetails, cardCurrency, presentAddress, manager)
      })
    }
  }

  private async orderCard(
    accountDetails: CompleteAccountDetails,
    cardCurrency: CurrencyCode,
    presentAddress: Address,
    manager: EntityManager,
  ) {
    let provider
    let providerAccount

    try {
      const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(cardCurrency)
      this.logger.log(`Attempting debit card order for ${accountDetails.id} using ${cardProviderFacade.getProvider()}`)

      providerAccount = await cardProviderFacade.createAccount(accountDetails, presentAddress)
      provider = cardProviderFacade.getProvider()
      this.logger.debug(`Successfully ordered card for ${accountDetails.id} using ${provider}`)
    } catch (e) {
      this.logger.error(`Error occured trying to order card for ${accountDetails.id}`)
      this.logger.error(JSON.stringify(e))
      this.cardOrderRequestRepository.updateOrderRequestStatus(
        accountDetails.id,
        cardCurrency,
        CardOrderRequestStatus.orderFailed,
        manager,
      )
      return
    }

    try {
      await this.persistDebitCardDetails(accountDetails, provider, providerAccount, cardCurrency, manager)
    } catch (e) {
      this.logger.error(JSON.stringify(e))
    }
  }

  private async persistDebitCardDetails(
    accountDetails: CompleteAccountDetails,
    provider: DebitCardProvider,
    providerAccount: ProviderAccountDetails,
    cardCurrency: CurrencyCode,
    manager: EntityManager,
  ) {
    await Promise.all([
      await this.cardRepository.createNewCard({
        accountId: accountDetails.id,
        provider,
        providerAccountDetails: providerAccount,
        currency: cardCurrency,
        balance: -this.configSource.getContisConfig().cardOrderFee,
        entityManager: manager,
      }),
      this.cardOrderRequestRepository.updateOrderRequestStatus(
        accountDetails.id,
        cardCurrency,
        CardOrderRequestStatus.completed,
        manager,
      ),
    ])
  }
}
