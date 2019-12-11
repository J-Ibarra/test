import { getEpicurusInstance } from '@abx/db-connection-utils'
import { OrderEndpoints } from './endpoints'

export function findOrderId(orderId: number) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderEndpoints.findOrderById, { orderId })
}

export * from './endpoints'
