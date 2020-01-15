import { getModel } from '@abx/db-connection-utils'
import { OrderEvent } from '@abx-types/order'

export async function findOrderEvents(query?: {}): Promise<OrderEvent[]> {
  const orders = await getModel<OrderEvent>('orderEvent').findAll(query)

  return orders.map(o => o.get())
}
