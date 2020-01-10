import { getEpicurusInstance } from '@abx/db-connection-utils'
import { OrderEndpoints } from './endpoints'

export function findOrderId(orderId: number) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderEndpoints.findOrderById, { orderId })
}

export function cancelAllOrdersForAccount(accountId: string) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(OrderEndpoints.cancelAllOrdersForAccount, { accountId })
}

export * from './endpoints'
