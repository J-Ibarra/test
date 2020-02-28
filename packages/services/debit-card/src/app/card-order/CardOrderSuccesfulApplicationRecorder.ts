import moment from 'moment'
import { TransactionManager, EntityManager } from 'typeorm'
import { Injectable, Inject, OnModuleInit } from '@nestjs/common'

import { CardRepository } from '../../shared-components/repositories/CardRepository'
import {
  CONFIG_SOURCE_TOKEN,
  ConfigSource,
} from '../../shared-components/providers'
import { DebitCardStatus } from '../../shared-components/models/card/DebitCardStatus.enum'

const ONE_MINUTE_IN_MILLIS = 60 * 1000

@Injectable()
export class CardOrderSuccessfulApplicationRecorder implements OnModuleInit {
  constructor(
    private cardRepository: CardRepository,
    @TransactionManager()
    private entityManager: EntityManager,
    @Inject(CONFIG_SOURCE_TOKEN) private configSource: ConfigSource,
  ) {}

  onModuleInit() {
    setInterval(() => {
      this.recordCardSuccessfulCardApplications()
    }, ONE_MINUTE_IN_MILLIS)
  }

  /**
   * Updates the status to 'awaiting_setup' for all cards that have been set
   * in 'under_review' status more than `cardOrderValidationSLAInMinutes` minutes ago.
   */
  public async recordCardSuccessfulCardApplications(): Promise<void> {
    await this.cardRepository.updateStatusForDebitCardsCreatedBefore(
      DebitCardStatus.awaitingSetup,
      DebitCardStatus.underReview,
      moment()
        .subtract(
          this.configSource.getContisConfig().cardOrderValidationSLAInMinutes,
          'minutes',
        )
        .toDate(),
      this.entityManager,
    )
  }
}
