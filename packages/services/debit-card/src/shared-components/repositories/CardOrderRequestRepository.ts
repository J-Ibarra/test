import { EntityRepository, Repository, EntityManager, UpdateResult } from 'typeorm'
import { CardOrderRequest, CardOrderRequestStatus, CurrencyCode, CARD_ORDER_REQUEST_TABLE, Address } from '../models'

/*eslint no-unused-vars: "error"*/
@EntityRepository(CardOrderRequest)
export class CardOrderRequestRepository extends Repository<CardOrderRequest> {
  saveCardOrderRequest(
    accountId: string,
    currency: CurrencyCode,
    status: CardOrderRequestStatus,
    presentAddress: Address,
    entityManager: EntityManager = this.manager,
  ): Promise<CardOrderRequest> {
    return entityManager.save(CardOrderRequest, {
      accountId,
      currency,
      status,
      presentAddress,
    } as any) as Promise<CardOrderRequest>
  }

  async updateOrderRequestStatus(
    accountId: string,
    currency: CurrencyCode,
    status: CardOrderRequestStatus,
    entityManager: EntityManager = this.manager,
  ): Promise<UpdateResult> {
    return entityManager.update<CardOrderRequest>(
      CardOrderRequest,
      { accountId, currency },
      {
        status,
      },
    )
  }

  getLatestOrderRequestForAccount(
    accountId: string,
    entityManager: EntityManager = this.manager,
    usePessimisticWriteLock: boolean = false,
  ): Promise<CardOrderRequest> {
    const queryBuilder = entityManager
      .createQueryBuilder(CardOrderRequest, CARD_ORDER_REQUEST_TABLE)
      .where(`${CARD_ORDER_REQUEST_TABLE}.accountId = :accountId`, {
        accountId,
      })
      .orderBy('created_at', 'DESC')

    if (usePessimisticWriteLock) {
      queryBuilder.setLock('pessimistic_write')
    }

    return queryBuilder.getOne() as Promise<CardOrderRequest>
  }

  getLatestOrderRequestForAccountAndCurrency(
    accountId: string,
    currency: CurrencyCode,
    entityManager: EntityManager = this.manager,
  ): Promise<CardOrderRequest[]> {
    return entityManager.find(CardOrderRequest, {
      accountId,
      currency,
    })
  }

  getOrderRequestsByStatus(
    status: CardOrderRequestStatus,
    entityManager: EntityManager = this.manager,
    usePessimisticWriteLock: boolean = false,
  ): Promise<CardOrderRequest[]> {
    const queryBuilder = entityManager
      .createQueryBuilder(CardOrderRequest, CARD_ORDER_REQUEST_TABLE)
      .where(`${CARD_ORDER_REQUEST_TABLE}.status = :status`, {
        status,
      })

    if (usePessimisticWriteLock) {
      queryBuilder.setLock('pessimistic_write')
    }

    return queryBuilder.getMany()
  }

  async deleteAll(entityManager: EntityManager = this.manager): Promise<void> {
    await entityManager.delete(CardOrderRequest, {})
  }
}
