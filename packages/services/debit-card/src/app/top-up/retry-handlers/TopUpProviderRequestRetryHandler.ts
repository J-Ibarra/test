import { EntityManager, TransactionManager } from 'typeorm'
import { Logger, Injectable } from '@nestjs/common'

import { TopUpRequestRepository, CardRepository } from '../../../shared-components/repositories'
import { TopUpRequestStatus, DebitCard } from '../../../shared-components/models'
import { TopUpBalanceLimitChecker } from '../request-dispatcher/TopUpBalanceLimitChecker'
import { TopUpRequestDispatcher } from '../request-dispatcher/TopUpRequestDispatcher'

const TWO_MINUTES_IN_MILLIS = 2 * 60 * 1000

/** A mechanism which re-attempts top up requests that have previously failed. */
@Injectable()
export class TopUpProviderRequestRetryHandler {
  private retryInProgress = false
  private logger = new Logger('TopUpProviderRequestRetryHandler')

  constructor(
    private readonly cardRepository: CardRepository,
    private readonly topUpRequestRepository: TopUpRequestRepository,
    private readonly topUpBalanceLimitChecker: TopUpBalanceLimitChecker,
    @TransactionManager() private readonly entityManager: EntityManager,
    private readonly topUpRequestDispatcher: TopUpRequestDispatcher,
  ) {
    setInterval(() => {
      if (!this.retryInProgress) {
        this.retryInProgress = true
        this.retryFailedTopUpRequests()
      }
    }, Number(process.env.DEBIT_CARD_TOP_UP_RETRY_INTERVAL || TWO_MINUTES_IN_MILLIS))
  }

  async retryFailedTopUpRequests() {
    const failedProviderRequests = await this.topUpRequestRepository.find({
      where: { status: TopUpRequestStatus.providerRequestExecutionFailed },
      relations: ['debitCard'],
    })

    await Promise.all(
      failedProviderRequests.map(failedProviderRequest =>
        this.executeProviderTopUp(
          failedProviderRequest.id,
          failedProviderRequest.debitCard.accountId,
          failedProviderRequest.amountFilled!,
        ),
      ),
    )

    this.retryInProgress = false
  }

  async executeProviderTopUp(topUpRequestId: number, accountId: string, amount: number): Promise<void> {
    this.logger.log(`Reattempting top up request ${topUpRequestId} where provider top up request previously failed`)

    return this.entityManager.transaction(async transactionManager => {
      const topUpRequest = await this.topUpRequestRepository.getTopUpRequest({
        topUpRequestId,
        entityManager: transactionManager,
        usePessimisticWriteLock: true,
      })

      const debitCard: DebitCard = await this.cardRepository.getDebitCardForAccountWithPessimisticLock(
        accountId,
        transactionManager,
      )
      const amountToReserve = await this.topUpBalanceLimitChecker.getAmountToTopUpBasedOnBalanceLimit(
        topUpRequest.id,
        amount,
        debitCard,
        transactionManager,
      )

      if (amountToReserve > 0) {
        return this.topUpRequestDispatcher.loadAmountOnCard(debitCard, amountToReserve, topUpRequestId, transactionManager)
      }
    })
  }
}
