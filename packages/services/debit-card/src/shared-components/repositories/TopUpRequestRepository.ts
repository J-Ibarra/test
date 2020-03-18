import { EntityRepository, Repository, EntityManager } from 'typeorm'

import { TopUpRequest, TopUpRequestStatus, TOP_UP_REQUEST_TABLE, DebitCard, KinesisCryptoCurrency } from '../models'

interface GetTopUpRequestParams {
  topUpRequestId: number
  entityManager?: EntityManager
  usePessimisticWriteLock?: boolean
  includeDebitCard?: boolean
}

@EntityRepository(TopUpRequest)
export class TopUpRequestRepository extends Repository<TopUpRequest> {
  createTopUpRequest(
    debitCard: DebitCard,
    orderId: number,
    amount: number,
    currency: KinesisCryptoCurrency,
    entityManager: EntityManager = this.manager,
  ): Promise<TopUpRequest> {
    return entityManager.save(TopUpRequest, {
      debitCard,
      orderId,
      soldCurrencyAmount: amount,
      soldCurrency: currency,
      status: TopUpRequestStatus.orderPlaced,
    }) as Promise<TopUpRequest>
  }

  async updateTopUpRequestByOrderId(
    orderId: number,
    updatedFields: Partial<TopUpRequest>,
    entityManager: EntityManager = this.manager,
  ): Promise<number[]> {
    const result = await entityManager
      .createQueryBuilder(TopUpRequest, TOP_UP_REQUEST_TABLE)
      .update(TopUpRequest)
      .where(`${TOP_UP_REQUEST_TABLE}.order_id = :orderId`, {
        orderId,
      })
      .set({ ...updatedFields })
      .output(['id'])
      .execute()

    return result.raw ? [result.raw[0].id] : []
  }

  async updateTopUpRequest(
    topUpRequestId: number,
    updatedFields: Partial<TopUpRequest>,
    entityManager: EntityManager = this.manager,
  ): Promise<boolean> {
    const result = await entityManager
      .createQueryBuilder(TopUpRequest, TOP_UP_REQUEST_TABLE)
      .update(TopUpRequest)
      .where(`${TOP_UP_REQUEST_TABLE}.id = :topUpRequestId`, {
        topUpRequestId,
      })
      .set({ ...updatedFields })
      .output(['id'])
      .execute()

    return result.raw && result.raw.length > 0
  }

  async getTopUpRequest({
    topUpRequestId,
    entityManager = this.manager,
    usePessimisticWriteLock = false,
  }: GetTopUpRequestParams): Promise<TopUpRequest> {
    const queryBuilder = entityManager
      .createQueryBuilder(TopUpRequest, TOP_UP_REQUEST_TABLE)
      .where(`${TOP_UP_REQUEST_TABLE}.id = :topUpRequestId`, {
        topUpRequestId,
      })

    if (usePessimisticWriteLock) {
      queryBuilder.setLock('pessimistic_write')
    }

    return queryBuilder.getOne() as Promise<TopUpRequest>
  }

  async getAllTopUpRequestsForDebitCard(debitCardId: number, entityManager = this.manager): Promise<TopUpRequest[]> {
    return entityManager
      .createQueryBuilder(TopUpRequest, TOP_UP_REQUEST_TABLE)
      .where(`${TOP_UP_REQUEST_TABLE}.debit_card_id = :debitCardId`, {
        debitCardId,
      })
      .getMany()
  }

  async getTopUpRequestByOrderId(orderId, entityManager = this.manager): Promise<TopUpRequest> {
    const queryBuilder = entityManager
      .createQueryBuilder(TopUpRequest, TOP_UP_REQUEST_TABLE)
      .where(`${TOP_UP_REQUEST_TABLE}.orderId = :orderId`, {
        orderId,
      })

    return queryBuilder.getOne() as Promise<TopUpRequest>
  }
}
