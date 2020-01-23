import { Transaction } from 'sequelize'
import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { AdminRequest, CreateAdminRequestParams } from '@abx-service-clients/admin-fund-management'
import { getNextGlobalTransactionId } from '../models/global_transaction_id'

export async function findAllAdminRequests(transaction?: Transaction): Promise<AdminRequest[]> {
  return wrapInTransaction(sequelize, transaction, async t => {
    const requests = await getModel<AdminRequest>('admin_request').findAll({
      transaction: t,
      order: [['createdAt', 'DESC']],
    })

    return requests.map(request => request.get())
  })
}

export async function findAllAdminRequestsForAccountHin(accountHin: number, transaction?: Transaction): Promise<AdminRequest[]> {
  return wrapInTransaction(sequelize, transaction, async t => {
    const requests = await getModel<AdminRequest>('admin_request').findAll({
      where: { hin: accountHin },
      transaction: t,
      order: [['createdAt', 'DESC']],
    })

    return requests.map(request => request.get())
  })
}

export async function findAdminRequest(queryParams: Partial<AdminRequest>, transaction?: Transaction): Promise<AdminRequest | null> {
  return wrapInTransaction(sequelize, transaction, async t => {
    const request = await getModel<AdminRequest>('admin_request').findOne({
      where: { ...queryParams } as any,
      transaction: t,
    })

    return !!request ? request.get() : null
  })
}

export async function updateAdminRequest(id: number, update: Partial<AdminRequest>, transaction?: Transaction): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, transaction, async t => {
    const updateResult = await getModel<Partial<AdminRequest>>('admin_request').update(
      { ...update },
      {
        where: { id },
        transaction: t,
        returning: true,
      },
    )

    return updateResult[1][0].get() as any
  })
}

export async function saveAdminRequest(adminRequest: CreateAdminRequestParams, transaction?: Transaction): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, transaction, async t => {
    const globalTransactionId = await getNextGlobalTransactionId(adminRequest.type, t)
    const createdAdminRequest = await getModel<AdminRequest>('admin_request').create({ ...adminRequest, globalTransactionId } as AdminRequest, {
      transaction: t,
    })

    return createdAdminRequest.get()
  })
}
