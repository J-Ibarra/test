import { Transaction } from 'sequelize'
import { sequelize, getModel, wrapInTransaction } from '@abx/db-connection-utils'
import { Order } from '@abx-types/order'

export async function findOrder(orderId: number, seqTransaction?: Transaction): Promise<Order | null> {
  return wrapInTransaction(sequelize, seqTransaction, async t => {
    const order = await getModel<Order>('order').findByPrimary(orderId, { transaction: t })

    return order ? order.get() : null
  })
}
