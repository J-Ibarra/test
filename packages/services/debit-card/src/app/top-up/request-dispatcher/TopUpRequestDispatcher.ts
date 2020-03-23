import { Injectable, Logger, Inject } from '@nestjs/common'
import { EntityManager } from 'typeorm'

import { DebitCard, TopUpRequestStatus } from '../../../shared-components/models'
import { TopUpRequestRepository } from '../../../shared-components/repositories'
import { CardProviderFacadeFactory, CARD_PROVIDER_FACADE_FACTORY } from '../../../shared-components/providers'
import { TopUpSuccessRecorder } from './TopUpSuccessRecorder'

@Injectable()
export class TopUpRequestDispatcher {
  private logger = new Logger('TopUpRequestDispatcher')

  constructor(
    private readonly topUpRequestRepository: TopUpRequestRepository,
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private readonly cardProviderFacadeFactory: CardProviderFacadeFactory,
    private readonly topUpSuccessRecorder: TopUpSuccessRecorder,
  ) {}

  async loadAmountOnCard(
    debitCard: DebitCard,
    amountReserved: number,
    topUpRequestId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const { success: balanceSuccessfullyLoaded, transactionId } = await this.executeProviderRequest(
      debitCard,
      amountReserved,
      topUpRequestId,
      entityManager,
    )

    if (balanceSuccessfullyLoaded) {
      await this.topUpSuccessRecorder.recordTopUpSuccess(topUpRequestId, debitCard, amountReserved, transactionId!, entityManager)
    }
  }

  private async executeProviderRequest(
    { providerAccountDetails, currency, accountId }: DebitCard,
    amountReserved: number,
    topUpRequestId: number,
    entityManager: EntityManager,
  ) {
    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(currency)

    this.logger.debug(
      `Loading ${cardProviderFacade.getProvider()} balance for account ${accountId} and currency ${currency}
      with ${amountReserved} (top up request - ${topUpRequestId})`,
    )

    try {
      const { transactionId } = await cardProviderFacade.loadBalance(topUpRequestId, providerAccountDetails, amountReserved)

      return {
        success: true,
        transactionId,
      }
    } catch (e) {
      this.logger.error(
        `Unable to load balance for top up request ${topUpRequestId}
        using provider ${cardProviderFacade.getProvider()}`,
      )
      await this.topUpRequestRepository.updateTopUpRequest(
        topUpRequestId,
        { status: TopUpRequestStatus.providerRequestExecutionFailed },
        entityManager,
      )

      return {
        success: false,
      }
    }
  }
}
