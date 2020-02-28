import { Entity, OneToOne, JoinColumn, Column } from 'typeorm'
import { BaseEntity } from '../BaseEntity.entity'
import { ColumnNumericTransformer } from '../../utils/column-numeric-transformer'
import { DebitCard } from './DebitCard.entity'

export const CARD_ACTIVATION_ATTEMPT_TABLE = 'card_activation_attempt'

@Entity(CARD_ACTIVATION_ATTEMPT_TABLE)
export class CardActivationAttempt extends BaseEntity {
  @OneToOne(() => DebitCard)
  @JoinColumn({ name: 'card_id' })
  card: DebitCard

  @Column({
    transformer: new ColumnNumericTransformer(),
  })
  attempts: number
}
