import { EntityManager } from 'typeorm'
import { Logger, Inject } from '@nestjs/common'

import { TopUpRequest, DebitCard, TopUpRequestStatus } from '../../../shared-components/models'
import { TopUpRequestRepository } from '../../../shared-components/repositories'
import { BalanceReserveFacade, BALANCE_RESERVE_FACADE_TOKEN } from '../../../shared-components/providers'
import { TopUpBalanceLimitChecker } from './TopUpBalanceLimitChecker'

export class TopUpBalanceReserver {
  private logger = new Logger('TopUpBalanceReserver')

  constructor(
    private readonly topUpRequestRepository: TopUpRequestRepository,
    @Inject(BALANCE_RESERVE_FACADE_TOKEN)
    private readonly balanceReserveFacade: BalanceReserveFacade,
    private readonly topUpBalanceLimitChecker: TopUpBalanceLimitChecker,
  ) {}

  public async reserveAllowedAmount(
    topUpRequest: TopUpRequest,
    card: DebitCard,
    maximumTopUpAmount: number,
    entityManager: EntityManager,
  ): Promise<{ amountReserved: number }> {
    const limitedAmountToTopUp = await this.topUpBalanceLimitChecker.getAmountToTopUpBasedOnBalanceLimit(
      topUpRequest.id,
      maximumTopUpAmount,
      card,
      entityManager,
    )

    this.logger.debug(
      `Reserving ${limitedAmountToTopUp}(of maximum ${maximumTopUpAmount}) ${card.currency} debit card
      top up balance for ${card.accountId} and top up request ${topUpRequest.id}`,
    )

    try {
      if (limitedAmountToTopUp > 0) {
        await this.balanceReserveFacade.reserveTopUpBalance(topUpRequest.id, card.accountId, limitedAmountToTopUp, card.currency)
      }

      return { amountReserved: limitedAmountToTopUp }
    } catch (e) {
      await this.topUpRequestRepository.updateTopUpRequest(
        topUpRequest.id,
        { status: TopUpRequestStatus.balanceReserveFailed },
        entityManager,
      )
      return { amountReserved: 0 }
    }
  }
}
