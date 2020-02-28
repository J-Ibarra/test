import { BaseEntity } from '../BaseEntity.entity'
import { Entity, Column } from 'typeorm'
import { CurrencyCode } from '../CurrencyCode.enum'

export type BalanceLimitConstraint = Record<CurrencyCode, number>
export enum CardConstraintName {
  minimumTopUpAmount = 'minimumTopUpAmount',
  balanceLimit = 'balanceLimit',
  withdrawalFee = 'withdrawalFee',
}

export const CARD_CONSTRAINT_TABLE = 'card_constraint'

@Entity(CARD_CONSTRAINT_TABLE)
export class CardConstraint extends BaseEntity {
  @Column({
    type: 'varchar',
  })
  name: CardConstraintName

  @Column({ type: 'varchar' })
  value: string
}
