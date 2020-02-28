import { Column, Entity } from 'typeorm'

import { CardOrderRequestStatus } from './CardOrderRequestStatus.enum'
import { CurrencyCode } from '../CurrencyCode.enum'
import { BaseEntity } from '../BaseEntity.entity'
import { Address } from '../Account.model'

export const CARD_ORDER_REQUEST_TABLE = 'card_order_request'

@Entity(CARD_ORDER_REQUEST_TABLE)
export class CardOrderRequest extends BaseEntity {
  @Column({ name: 'account_id' })
  accountId: string

  @Column({
    type: 'enum',
    enum: Object.values(CurrencyCode),
    default: CurrencyCode.EUR,
  })
  currency: CurrencyCode

  @Column({
    type: 'enum',
    enum: Object.values(CardOrderRequestStatus),
    default: CardOrderRequestStatus.orderPending,
  })
  status: CardOrderRequestStatus

  @Column({
    name: 'present_address',
    type: 'jsonb',
  })
  presentAddress: Address
}
