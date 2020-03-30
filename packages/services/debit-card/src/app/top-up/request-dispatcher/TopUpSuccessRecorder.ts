import { EntityManager } from 'typeorm'
import { Logger, Inject, Injectable } from '@nestjs/common'

import { DebitCard, TopUpRequestStatus } from '../../../shared-components/models'
import { BALANCE_RESERVE_FACADE_TOKEN, BalanceReserveFacade } from '../../../shared-components/providers'
import { TopUpRequestRepository, CardRepository, TransactionRepository } from '../../../shared-components/repositories'

@Injectable()
export class TopUpSuccessRecorder {
  private logger = new Logger('TopUpRequestDispatcher')

  constructor(
    private readonly topUpRequestRepository: TopUpRequestRepository,
    @Inject(BALANCE_RESERVE_FACADE_TOKEN)
    private readonly balanceReserveFacade: BalanceReserveFacade,
    private readonly debitCardRepository: CardRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async recordTopUpSuccess(
    topUpRequestId: number,
    card: DebitCard,
    topUpAmount: number,
    providerTransactionIdentifier: number,
    transactionManager: EntityManager,
  ) {
    this.logger.debug(
      `Confirming ${topUpAmount} ${card.currency} debit card top up balance for
      ${card.accountId} and top up request ${topUpRequestId}`,
    )

    try {
      await this.balanceReserveFacade.confirmTopUpBalance(topUpRequestId, card.accountId, topUpAmount, card.currency)

      await Promise.all([
        this.topUpRequestRepository.updateTopUpRequest(
          topUpRequestId,
          { status: TopUpRequestStatus.complete },
          transactionManager,
        ),
        this.transactionRepository.createDepositTransaction(
          card,
          topUpAmount,
          topUpRequestId,
          providerTransactionIdentifier,
          transactionManager,
        ),
        this.debitCardRepository.increaseAvailableBalance(card.id, topUpAmount, transactionManager),
      ])

      this.logger.debug(`Top up request ${topUpRequestId} successfully completed`)
    } catch (e) {
      await this.topUpRequestRepository.updateTopUpRequest(
        topUpRequestId,
        { status: TopUpRequestStatus.balanceConfirmationFailed },
        transactionManager,
      )
    }
  }
}
