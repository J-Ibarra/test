import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../BaseEntity.entity'
import { DebitCard } from '../card'
import { ColumnNumericTransformer } from '../../utils/column-numeric-transformer'
import { TopUpRequest } from '../top-up'

export const TRANSACTION_TABLE = 'transaction'

export class CoreTransactionDetails {
  id?: number
  amount: number
  type: TransactionType
  description: string
  providerTransactionIdentifier?: number
  metadata?: WithdrawalTransactionMetadata | TopUpTransactionMetadata | null
  createdAt: Date

  static ofTopUpRequest(topUpRequest: TopUpRequest) {
    return {
      amount: topUpRequest.amountToTopUp!,
      type: TransactionType.incoming,
      description: `Pending deposit from ${topUpRequest.soldCurrency} account`,
      metadata: {
        topUpRequestId: topUpRequest.id,
      },
      createdAt: topUpRequest.createdAt,
    }
  }
}

export interface WithdrawalTransactionMetadata {
  fee: number
}

export interface TopUpTransactionMetadata {
  topUpRequestId: number
}

@Entity(TRANSACTION_TABLE)
export class Transaction extends BaseEntity implements CoreTransactionDetails {
  @ManyToOne(() => DebitCard, debitCard => debitCard.id)
  @JoinColumn({ name: 'debit_card_id' })
  debitCard: DebitCard

  @Column({ transformer: new ColumnNumericTransformer() })
  amount: number

  @Column()
  type: TransactionType

  @Column()
  description: string

  @Column({ name: 'provider_transaction_identifier', transformer: new ColumnNumericTransformer() })
  providerTransactionIdentifier: number

  @Column({ name: 'metadata', type: 'jsonb' })
  metadata?: WithdrawalTransactionMetadata | TopUpTransactionMetadata | null
}

export enum TransactionType {
  incoming = 'incoming',
  outgoing = 'outgoing',
}
