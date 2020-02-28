import { EntityRepository, Repository, EntityManager } from 'typeorm'
import { Transaction, TRANSACTION_TABLE, DebitCard, TransactionType } from '../models'

export type NewTransactionParams = Pick<
  Transaction,
  'debitCard' | 'type' | 'description' | 'amount' | 'providerTransactionIdentifier'
>

@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction> {
  recordTransaction(params: NewTransactionParams, entityManager: EntityManager = this.manager): Promise<Partial<Transaction>> {
    return entityManager.save(Transaction, params)
  }

  createWithdrawalTransaction(
    debitCard: DebitCard,
    amount: number,
    fee: number,
    providerTransactionIdentifier: number,
    entityManager: EntityManager = this.manager,
  ): Promise<Partial<Transaction>> {
    return entityManager.save(Transaction, {
      debitCard,
      type: TransactionType.outgoing,
      amount,
      metadata: { fee },
      description: `Withdrawal to ${debitCard.currency} account`,
      providerTransactionIdentifier,
    })
  }

  createDepositTransaction(
    debitCard: DebitCard,
    amount: number,
    topUpRequestId: number,
    providerTransactionIdentifier: number,
    entityManager: EntityManager = this.manager,
  ): Promise<Partial<Transaction>> {
    return entityManager.save(Transaction, {
      debitCard,
      type: TransactionType.incoming,
      amount,
      metadata: { topUpRequestId },
      description: `Deposit from ${debitCard.currency} exchange account`,
      providerTransactionIdentifier,
    })
  }

  getAllForCard(cardId: number, entityManager: EntityManager = this.manager): Promise<Transaction[]> {
    return entityManager
      .createQueryBuilder(Transaction, TRANSACTION_TABLE)
      .where(`${TRANSACTION_TABLE}.debit_card_id = :cardId`, {
        cardId,
      })
      .getMany()
  }

  async deleteAll(entityManager: EntityManager = this.manager): Promise<void> {
    await entityManager.delete(Transaction, {})
  }
}
