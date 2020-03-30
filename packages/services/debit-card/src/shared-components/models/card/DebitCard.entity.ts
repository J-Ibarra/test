import { Entity, Column, OneToMany } from 'typeorm'

import { DebitCardProvider } from './Provider.enum'
import { ProviderAccountDetails, ProviderTransformer } from './ProviderAccountDetails.model'
import { CurrencyCode } from '../CurrencyCode.enum'
import { DebitCardStatus } from './DebitCardStatus.enum'
import { BaseEntity } from '../BaseEntity.entity'
import { Transaction } from '../transaction/Transaction.entity'
import { ColumnNumericTransformer } from '../../utils/column-numeric-transformer'

export const DEBIT_CARD_TABLE = 'debit_card'

@Entity(DEBIT_CARD_TABLE)
export class DebitCard extends BaseEntity {
  @Column({ name: 'account_id' })
  accountId: string

  @Column({
    type: 'enum',
    enum: DebitCardProvider,
    default: DebitCardProvider.contis,
  })
  provider: DebitCardProvider

  @Column({ name: 'provider_account_details', type: 'jsonb', transformer: new ProviderTransformer() })
  providerAccountDetails: ProviderAccountDetails

  @Column({
    type: 'enum',
    enum: CurrencyCode,
    default: CurrencyCode.EUR,
  })
  currency: CurrencyCode

  @Column({
    type: 'enum',
  })
  status: DebitCardStatus

  @Column({
    transformer: new ColumnNumericTransformer(),
  })
  balance: number

  @OneToMany(() => Transaction, transaction => transaction.debitCard)
  transactions: Transaction[]

  constructor(
    accountId: string,
    provider: DebitCardProvider,
    details: ProviderAccountDetails,
    currency: CurrencyCode,
    status: DebitCardStatus,
    balance: number,
  ) {
    super()
    this.accountId = accountId
    this.provider = provider
    this.providerAccountDetails = details
    this.currency = currency
    this.status = status
    this.balance = balance
  }

  getProviderAccountId() {
    return this.providerAccountDetails.getProviderAccountId()
  }

  isLostOrDamaged() {
    return this.status === DebitCardStatus.lost || this.status === DebitCardStatus.damaged
  }

  getCardId() {
    return this.providerAccountDetails.getCardId()
  }
}
