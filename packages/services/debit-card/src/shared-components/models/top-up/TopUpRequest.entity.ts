import { ManyToOne, JoinColumn, Column, Entity } from 'typeorm'

import { DebitCard } from '../card'
import { ColumnNumericTransformer } from '../../utils/column-numeric-transformer'
import { TopUpRequestStatus } from './TopUpRequestStatus.enum'
import { BaseEntity } from '../BaseEntity.entity'
import { KinesisCryptoCurrency } from '../CurrencyCode.enum'

export const TOP_UP_REQUEST_TABLE = 'top_up_request'
export const TOP_UP_REQUEST_DESCRIPTION = 'KINESIS_TOP_UP'

@Entity('top_up_request')
export class TopUpRequest extends BaseEntity {
  @ManyToOne(() => DebitCard)
  @JoinColumn({ name: 'debit_card_id' })
  debitCard: DebitCard

  @Column({ name: 'order_id', transformer: new ColumnNumericTransformer() })
  orderId: number

  @Column({
    name: 'sold_currency_amount',
    transformer: new ColumnNumericTransformer(),
  })
  soldCurrencyAmount: number

  @Column({
    name: 'sold_currency',
    type: 'varchar',
  })
  soldCurrency: KinesisCryptoCurrency

  @Column({
    type: 'varchar',
  })
  status: TopUpRequestStatus

  @Column({
    name: 'amount_to_top_up',
    type: 'numeric',
    transformer: new ColumnNumericTransformer(),
  })
  amountToTopUp: number | null

  @Column({
    name: 'amount_filled',
    type: 'numeric',
    transformer: new ColumnNumericTransformer(),
  })
  amountFilled: number | null
}
