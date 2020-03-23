import { EntityManager, TransactionManager } from 'typeorm'
import { Injectable, Logger } from '@nestjs/common'

import { CardRepository, TopUpRequestRepository } from '../../shared-components/repositories'
import { TopUpRequestStatus, DebitCard } from '../../shared-components/models'
import { TopUpBalanceReserver } from './request-dispatcher/TopUpBalanceReserver'
import { TopUpRequestDispatcher } from './request-dispatcher/TopUpRequestDispatcher'

@Injectable()
export class TopUpExecutor {
  private logger = new Logger('TopUpExecutor')

  constructor(
    private readonly cardRepository: CardRepository,
    private readonly topUpRequestRepository: TopUpRequestRepository,
    @TransactionManager()
    private readonly entityManager: EntityManager,
    private readonly topUpBalanceReserver: TopUpBalanceReserver,
    private readonly topUpRequestDispatcher: TopUpRequestDispatcher,
  ) {}

  /**
   * Handles the workflow of loading an account with a certain amount of money.
   *
   * @param topUpRequestId the id of the request that  should be fulfilled
   * @param accountId the id of the account to be loaded
   * @param amount the amount to be loaded into the account
   * @param entityManager allows for a parent entityManager to be passed in, propagating a parent transaction
   */
  async executeTopUp(topUpRequestId: number, accountId: string, amount: number): Promise<void> {
    return this.entityManager.transaction(async transactionManager => {
      const topUpRequest = await this.topUpRequestRepository.getTopUpRequest({
        topUpRequestId,
        entityManager: transactionManager,
        usePessimisticWriteLock: true,
      })

      if (topUpRequest.status === TopUpRequestStatus.orderPlaced) {
        const debitCard: DebitCard = await this.cardRepository.getDebitCardForAccountWithPessimisticLock(
          accountId,
          transactionManager,
        )

        const { amountReserved } = await this.topUpBalanceReserver.reserveAllowedAmount(
          topUpRequest,
          debitCard,
          amount,
          transactionManager,
        )

        if (amountReserved > 0) {
          return this.topUpRequestDispatcher.loadAmountOnCard(debitCard, amountReserved, topUpRequestId, transactionManager)
        }
      } else {
        this.logger.debug(`Attempted to execute top up for ${topUpRequestId} which has already been flagged as completed`)
      }
    })
  }
}
