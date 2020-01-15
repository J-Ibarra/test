import { Transaction, WhereOptions } from 'sequelize'
import { sequelize, getModel } from '@abx/db-connection-utils'
import { OrderMatch, OrderMatchStatus } from '@abx-types/order'

export class OrderMatchRepository {
  private static instance: OrderMatchRepository

  /** Creates and returns a {@link OrderMatchRepository} instance, if one already created returns that. */
  public static getInstance(): OrderMatchRepository {
    if (!this.instance) {
      this.instance = new OrderMatchRepository()
    }

    return this.instance
  }

  public async retrieveOrderMatch(orderMatchId: number, transaction: Transaction): Promise<OrderMatch | null> {
    const orderMatchInstance = await getModel<OrderMatch>('orderMatchTransaction').findById(orderMatchId, {
      transaction,
    })

    return orderMatchInstance ? orderMatchInstance.get() : null
  }

  public setOrderMatchStatusToSettled(orderMatchId: number, transaction: Transaction): Promise<void> {
    return sequelize.models.orderMatchTransaction.update(
      {
        status: OrderMatchStatus.settled,
      },
      {
        where: { id: orderMatchId },
        transaction,
      },
    ) as any
  }

  public async getOrderMatchCountForOrder(criteria: WhereOptions, transaction?: Transaction): Promise<number> {
    return getModel<OrderMatch>('orderMatchTransaction').count({ where: criteria, transaction })
  }

  public async lockOrderMatchTransaction(orderMatchId: number, transaction: Transaction): Promise<OrderMatch | null> {
    const orderMatch = await getModel<OrderMatch>('orderMatchTransaction').findById(orderMatchId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    })

    return !!orderMatch ? orderMatch.get() : null
  }
}
