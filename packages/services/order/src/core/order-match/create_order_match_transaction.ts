import { sequelize } from '@abx/db-connection-utils'
import { OrderMatch } from '@abx-types/order'

export async function createOrderMatchTransaction(orderMatch: OrderMatch, t: any) {
  return sequelize.models.orderMatchTransaction.create(orderMatch, { transaction: t })
}
