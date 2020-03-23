import { EntityRepository, Repository, EntityManager } from 'typeorm'
import { DebitCard, DebitCardProvider, ProviderAccountDetails, CurrencyCode, DEBIT_CARD_TABLE } from '../models'
import { DebitCardStatus } from '../models/card/DebitCardStatus.enum'

interface CardCreationParams {
  accountId: string
  provider: DebitCardProvider
  providerAccountDetails: ProviderAccountDetails
  currency: CurrencyCode
  balance: number
  entityManager?: EntityManager
}

@EntityRepository(DebitCard)
export class CardRepository extends Repository<DebitCard> {
  createNewCard({
    accountId,
    provider,
    providerAccountDetails,
    currency,
    balance,
    entityManager = this.manager,
  }: CardCreationParams): Promise<DebitCard> {
    return entityManager.save(DebitCard, {
      accountId,
      provider,
      providerAccountDetails,
      currency,
      balance,
      status: DebitCardStatus.underReview,
    }) as Promise<DebitCard>
  }

  async increaseAvailableBalance(id: number, increment: number, entityManager: EntityManager = this.manager): Promise<void> {
    await entityManager
      .createQueryBuilder(DebitCard, DEBIT_CARD_TABLE)
      .update(DebitCard)
      .where(`${DEBIT_CARD_TABLE}.id = :id`, {
        id,
      })
      .set({ balance: () => `balance + ${increment}` })
      .output(['id'])
      .execute()
  }

  async updateCardBalance(id: number, balance: number, entityManager: EntityManager = this.manager) {
    await entityManager.update(DebitCard, { id }, { balance })
  }

  async decreaseAvailableBalance(id: number, decrement: number, entityManager: EntityManager = this.manager): Promise<void> {
    await entityManager
      .createQueryBuilder(DebitCard, DEBIT_CARD_TABLE)
      .update(DebitCard)
      .where(`${DEBIT_CARD_TABLE}.id = :id`, {
        id,
      })
      .set({ balance: () => `balance - ${decrement}` })
      .output(['id'])
      .execute()
  }

  async updateCardStatus(
    details: ProviderAccountDetails,
    status: DebitCardStatus,
    entityManager: EntityManager = this.manager,
  ): Promise<boolean> {
    const result = await entityManager
      .createQueryBuilder(DebitCard, DEBIT_CARD_TABLE)
      .update(DebitCard)
      .where(`${DEBIT_CARD_TABLE}.provider_account_details @> :details`, {
        details,
      })
      .set({ status })
      .output(['id'])
      .execute()

    return result.raw && result.raw.length > 0
  }

  async updateStatusForDebitCardsCreatedBefore(
    newStatus: DebitCardStatus,
    oldStatus: DebitCardStatus,
    from: Date,
    entityManager: EntityManager = this.manager,
  ): Promise<boolean> {
    const result = await entityManager
      .createQueryBuilder(DebitCard, DEBIT_CARD_TABLE)
      .update(DebitCard)
      .where(`${DEBIT_CARD_TABLE}.status = :status`, {
        status: oldStatus,
      })
      .andWhere(`${DEBIT_CARD_TABLE}.created_at < :created`, {
        created: from.toISOString(),
      })
      .set({ status: newStatus })
      .output(['id'])
      .execute()

    return result.raw ? result.raw.length : 0
  }

  async getDebitCardForAccount(accountId: string, entityManager: EntityManager = this.manager): Promise<DebitCard> {
    return entityManager.findOne(DebitCard, {
      accountId,
    }) as Promise<DebitCard>
  }

  async getDebitCardForAccountWithPessimisticLock(
    accountId: string,
    entityManager: EntityManager = this.manager,
  ): Promise<DebitCard> {
    const queryBuilder = entityManager
      .createQueryBuilder(DebitCard, DEBIT_CARD_TABLE)
      .where(`${DEBIT_CARD_TABLE}.account_id = :accountId`, {
        accountId,
      })
      .setLock('pessimistic_write')

    return queryBuilder.getOne() as Promise<DebitCard>
  }

  async getDebitCardByProviderDetails(
    details: ProviderAccountDetails,
    entityManager: EntityManager = this.manager,
  ): Promise<DebitCard> {
    const result = await entityManager
      .createQueryBuilder(DebitCard, DEBIT_CARD_TABLE)
      .select()
      .where(`${DEBIT_CARD_TABLE}.provider_account_details @> :details`, {
        details,
      })

    return result.getOne() as Promise<DebitCard>
  }

  async getAllForStatuses(statuses: DebitCardStatus[], entityManager: EntityManager = this.manager): Promise<DebitCard[]> {
    const result = await entityManager
      .createQueryBuilder(DebitCard, DEBIT_CARD_TABLE)
      .select()
      .where(`${DEBIT_CARD_TABLE}.status IN (:...statuses)`, {
        statuses,
      })

    return result.getMany()
  }

  async updateCardWhereProviderDetailsMatch(
    details: ProviderAccountDetails,
    newDetails: Partial<DebitCard>,
    entityManager: EntityManager = this.manager,
  ): Promise<boolean> {
    const result = await entityManager
      .createQueryBuilder(DebitCard, DEBIT_CARD_TABLE)
      .update(DebitCard)
      .where(`${DEBIT_CARD_TABLE}.provider_account_details @> :details`, {
        details,
      })
      .set({ ...newDetails })
      .output(['id'])
      .execute()

    return result.raw && result.raw.length > 0
  }

  async deleteAll(entityManager: EntityManager = this.manager): Promise<void> {
    await entityManager.delete(DebitCard, {})
  }
}
