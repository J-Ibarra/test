import { sequelize, getModel, wrapInTransaction, getEpicurusInstance } from '@abx/db-connection-utils'
import { OrderMatch, OrderMatchStatus } from '@abx-types/order'
import { OrderPubSubChannels } from '@abx-service-clients/order'

export async function waitForSettlement(orderId: number, side: 'buy' | 'sell') {
  const query = side === 'buy' ? { where: { buyOrderId: orderId } } : { where: { sellOrderId: orderId } }

  const om = await wrapInTransaction(sequelize, null, async t => {
    const results = await getModel<OrderMatch>('orderMatchTransaction').findOne({ ...query, transaction: t } as any)
    return results ? results.get() : null
  })

  if (!om) {
    await new Promise(res => setTimeout(res, 20))
    return waitForSettlement(orderId, side)
  }

  if (om.status === OrderMatchStatus.settled) {
    return true
  }

  await new Promise(res => setTimeout(res, 20))
  return waitForSettlement(orderId, side)
}

export async function waitForOrderMatchSettledEvent() {
  return new Promise(resolve => {
    getEpicurusInstance().subscribe(OrderPubSubChannels.orderMatchSettled, () => resolve())
  })
}
