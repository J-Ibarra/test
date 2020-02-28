import Decimal from 'decimal.js'
import { EntityManager } from 'typeorm'
import { Logger, Injectable } from '@nestjs/common'

import { DebitCard, CardConstraintName, TopUpRequestStatus, BalanceLimitConstraint } from '../../../shared-components/models'
import { BalanceSourceOfTruthComparator, CardConstraintService } from '../../../shared-components/providers'
import { TopUpRequestRepository } from '../../../shared-components/repositories'

@Injectable()
export class TopUpBalanceLimitChecker {
  private logger = new Logger('TopUpBalanceLimitChecker')

  constructor(
    private readonly topUpRequestRepository: TopUpRequestRepository,
    private readonly balanceSourceOfTruthComparator: BalanceSourceOfTruthComparator,
    private readonly cardConstraintsService: CardConstraintService,
  ) {}

  public async getAmountToTopUpBasedOnBalanceLimit(
    topUpRequestId: number,
    amount: number,
    card: DebitCard,
    entityManager: EntityManager,
  ): Promise<number> {
    const cardLimitConstraint = await this.cardConstraintsService.getCardConstraintValue<BalanceLimitConstraint>(
      CardConstraintName.balanceLimit,
    )
    const cardLimit = cardLimitConstraint[card.currency]
    const upToDateBalance = await this.balanceSourceOfTruthComparator.syncCardBalanceWithSourceOfTruth(card, entityManager)

    let amountToTopUp = amount
    if (new Decimal(upToDateBalance).add(amount).toNumber() > cardLimit) {
      this.logger.debug(`Top up amount ${amount} for request ${topUpRequestId} exceeds balance limit`)
      const balanceToTopUp = new Decimal(cardLimit).minus(upToDateBalance).toNumber()

      this.logger.debug(`Only ${balanceToTopUp} can be topped up for request ${topUpRequestId}`)
      amountToTopUp = balanceToTopUp
    }

    this.updateTopUpStatusBasedOnAmount(topUpRequestId, amountToTopUp, entityManager)

    return amountToTopUp
  }

  private updateTopUpStatusBasedOnAmount(topUpRequestId: number, amountToTopUp: number, transactionManager: EntityManager) {
    if (amountToTopUp > 0) {
      return this.topUpRequestRepository.updateTopUpRequest(topUpRequestId, { amountToTopUp }, transactionManager)
    } else {
      return this.topUpRequestRepository.updateTopUpRequest(
        topUpRequestId,
        { status: TopUpRequestStatus.complete },
        transactionManager,
      )
    }
  }
}
