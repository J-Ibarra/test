import { getModel } from '@abx/db-connection-utils'
import { Order } from '@abx-types/order'

export async function findRawOrders(orderIds: number[]): Promise<Order[]> {
  const orders = await getModel<Order>('order').findAll({ where: { id: orderIds }})

  return orders.map(o => o.get())
}
