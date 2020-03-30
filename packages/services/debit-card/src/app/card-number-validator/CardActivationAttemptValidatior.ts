import { CardActivationAttemptRepository } from '../../shared-components/repositories'
import { DebitCard } from '../../shared-components/models'
import moment from 'moment'
import { Injectable } from '@nestjs/common'

@Injectable()
export class CardActivationAttemptValidator {
  public static MAXIMUM_ALLOWED_ACTIVATION_ATTEMPTS = 10

  constructor(private cardActivationAttemptRepository: CardActivationAttemptRepository) {}

  async maximumDailyActivationAttemptsExceeded(
    card: DebitCard,
  ): Promise<{ attemptsExceeded: boolean; lastActivationAttempt: Date | null }> {
    const cardActivationAttemptRecord = await this.cardActivationAttemptRepository.getActivationAttemptsForCard(card.id)

    if (!cardActivationAttemptRecord) {
      await this.cardActivationAttemptRepository.insertActivationAttemptRecordForCard(card)

      return {
        attemptsExceeded: false,
        lastActivationAttempt: new Date(),
      }
    }

    const lastActivationAttemptMoreThan24HoursAgo = moment(cardActivationAttemptRecord!.updatedAt).isBefore(
      moment().subtract(24, 'hours'),
    )

    if (lastActivationAttemptMoreThan24HoursAgo) {
      await this.cardActivationAttemptRepository.resetAttemptsForCard(card.id)

      return {
        attemptsExceeded: false,
        lastActivationAttempt: null,
      }
    }

    await this.cardActivationAttemptRepository.incrementActivationAttemptsForCard(card.id)

    return {
      attemptsExceeded: cardActivationAttemptRecord.attempts > CardActivationAttemptValidator.MAXIMUM_ALLOWED_ACTIVATION_ATTEMPTS,
      lastActivationAttempt: cardActivationAttemptRecord.updatedAt,
    }
  }
}
