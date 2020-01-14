import * as _ from 'lodash'
import { RuntimeError } from '@abx-types/error'
import { wrapInTransaction, getModel, sequelize } from '@abx/db-connection-utils'
import { Order, OrderMetadata, OrderStatus } from '@abx-types/order'
import { Transaction } from 'sequelize'

interface SaveOrderParams {
  order: Order
  cancellationReason?: string
  transaction?: Transaction
}

export function saveOrder({ order, cancellationReason, transaction }: SaveOrderParams): Promise<Order> {
  const saveOrderFunction = order.status === OrderStatus.submit ? createOrder : updateOrder.bind(null, cancellationReason)
  return wrapInTransaction(sequelize, transaction, async t => {
    try {
      return saveOrderFunction(order, t)
    } catch (e) {
      throw new RuntimeError(`Unable to create/update order (id: ${order.id})`, {
        context: {
          error: e,
        },
      })
    }
  })
}

export async function createOrder(orderParams: Order, transaction?: any) {
  return wrapInTransaction(sequelize, transaction, async t => {
    const order = await getModel<Order>('order').create(orderParams, { transaction: t })

    return order.get()
  })
}

function updateOrder(cancellationReason: string, order: Order, transaction?: any) {
  const metadata = order.metadata || ({} as OrderMetadata)
  if (cancellationReason) {
    metadata.cancellationReason = cancellationReason
  }

  // At the moment these are the only fields that can be updated.
  // If we do end up increasing the scope of what can be updated
  // We should be careful with how we handle proxy spread orders.
  const orderUpdateQuery = `
    UPDATE public."order"
      SET
        remaining = :remaining,
        status = :status,
        "metadata" = :metadata,
        "updatedAt" = :updatedAt
      WHERE id = ${order.id}
  `

  return wrapInTransaction(sequelize, transaction, async t => {
    await sequelize.query(orderUpdateQuery, {
      transaction: t,
      replacements: {
        remaining: order.remaining,
        status: order.status,
        metadata: !_.isEmpty(metadata) ? JSON.stringify(metadata) : null,
        updatedAt: new Date().toISOString(),
      },
    })

    return order
  })
}
