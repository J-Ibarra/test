import { Transaction } from 'sequelize'
import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { Order } from '@abx-types/order'
import { findAccountWithUserDetails } from '@abx-service-clients/account'

export async function findOrder(orderId: number, seqTransaction?: Transaction): Promise<Order | null> {
  return wrapInTransaction(sequelize, seqTransaction, async (t) => {
    const order = await getModel<Order>('order').findByPrimary(orderId, { transaction: t })

    return order ? order.get() : null
  })
}

export async function getOrdersCount(): Promise<number> {
  return getModel<Order>('order').count()
}

export async function getOrderCountForAccountHin(hin: string): Promise<number> {
  const account = await findAccountWithUserDetails({ hin })

  return getModel<Order>('order').count({
    where: {
      accountId: account!.id!,
    },
  })
}
