import { EntityRepository, Repository } from 'typeorm'
import { CardActivationAttempt, CARD_ACTIVATION_ATTEMPT_TABLE, DebitCard } from '../models'

@EntityRepository(CardActivationAttempt)
export class CardActivationAttemptRepository extends Repository<CardActivationAttempt> {
  getActivationAttemptsForCard(cardId: number): Promise<CardActivationAttempt | undefined> {
    return this.manager
      .createQueryBuilder(CardActivationAttempt, CARD_ACTIVATION_ATTEMPT_TABLE)
      .where(`${CARD_ACTIVATION_ATTEMPT_TABLE}.card_id = :cardId`, {
        cardId,
      })
      .getOne()
  }

  insertActivationAttemptRecordForCard(card: DebitCard): Promise<CardActivationAttempt> {
    return this.manager.save(CardActivationAttempt, {
      card,
      attempts: 1,
    }) as Promise<CardActivationAttempt>
  }

  async incrementActivationAttemptsForCard(cardId: number): Promise<void> {
    await this.manager
      .createQueryBuilder(CardActivationAttempt, CARD_ACTIVATION_ATTEMPT_TABLE)
      .update(CardActivationAttempt)
      .where(`${CARD_ACTIVATION_ATTEMPT_TABLE}.card_id = :cardId`, {
        cardId,
      })
      .set({ attempts: () => `attempts + 1` })
      .output(['id'])
      .execute()
  }

  async resetAttemptsForCard(cardId: number) {
    await this.manager
      .createQueryBuilder(CardActivationAttempt, CARD_ACTIVATION_ATTEMPT_TABLE)
      .update(CardActivationAttempt)
      .where(`${CARD_ACTIVATION_ATTEMPT_TABLE}.card_id = :cardId`, {
        cardId,
      })
      .set({ attempts: 1 })
      .output(['id'])
      .execute()
  }
}
