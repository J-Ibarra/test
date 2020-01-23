import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { OrderDataEndpoints } from './endpoints'

export function findOrderId(orderId: number) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderDataEndpoints.findOrderById, { orderId })
}

export * from './endpoints'
