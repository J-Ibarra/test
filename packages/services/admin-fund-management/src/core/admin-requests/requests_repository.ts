import { Transaction } from 'sequelize'
import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { AdminRequest, CreateAdminRequestParams } from '@abx-service-clients/admin-fund-management'
import { getNextGlobalTransactionId } from '../models/global_transaction_id'
import { findUsersByEmail, findAccountById } from '@abx-service-clients/account'

export interface FindAllAdminRequestsParams {
  limit?: number
  offset?: number
  transaction?: Transaction
}

export async function findAllAdminRequests({ limit, offset, transaction }: FindAllAdminRequestsParams = {}): Promise<AdminRequest[]> {
  return wrapInTransaction(sequelize, transaction, async (t) => {
    const requests = await getModel<AdminRequest>('admin_request').findAll({
      transaction: t,
      order: [['createdAt', 'DESC']],
      limit: limit || 50,
      offset: offset || 0,
    })

    return requests.map((request) => request.get())
  })
}

export async function countAllAdminRequests(accountHin?: string): Promise<number> {
  return getModel<AdminRequest>('admin_request').count(
    accountHin
      ? {
          where: {
            hin: accountHin,
          },
        }
      : {},
  )
}

export async function findAllAdminRequestsForAccountHin({
  accountHin,
  transaction,
  limit,
  offset,
}: {
  accountHin: string
  transaction?: Transaction
  limit?: number
  offset?: number
}): Promise<AdminRequest[]> {
  return wrapInTransaction(sequelize, transaction, async (t) => {
    const requests = await getModel<AdminRequest>('admin_request').findAll({
      where: { hin: accountHin },
      transaction: t,
      order: [['createdAt', 'DESC']],
      limit: limit || 50,
      offset: offset || 0,
    })

    return requests.map((request) => request.get())
  })
}

export async function findAdminRequest(queryParams: Partial<AdminRequest>, transaction?: Transaction): Promise<AdminRequest | null> {
  return wrapInTransaction(sequelize, transaction, async (t) => {
    const request = await getModel<AdminRequest>('admin_request').findOne({
      where: { ...queryParams } as any,
      transaction: t,
    })

    return !!request ? request.get() : null
  })
}

export async function findSpecificAdminRequests(ids: string[]): Promise<AdminRequest[]> {
  const requests = await getModel<AdminRequest>('admin_request').findAll({
    where: { id: { $in: ids } },
  })

  return requests.map((request) => request.get())
}

export async function updateAdminRequest(id: number, update: Partial<AdminRequest>, transaction?: Transaction): Promise<AdminRequest> {
  return wrapInTransaction(sequelize, transaction, async (t) => {
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
  return wrapInTransaction(sequelize, transaction, async (t) => {
    try {
      const globalTransactionId = await getNextGlobalTransactionId(adminRequest.type, t)
      const createdAdminRequest = await getModel<AdminRequest>('admin_request').create({ ...adminRequest, globalTransactionId } as AdminRequest, {
        transaction: t,
      })

      return createdAdminRequest.get()
    } catch (e) {
      console.log(JSON.stringify(e))
      throw e
    }
  })
}

export async function deleteAllRequestsByEmail(email: string, transaction?: Transaction): Promise<void> {
  return wrapInTransaction(sequelize, transaction, async (t) => {
    try {
      const [user] = await findUsersByEmail([email.toLowerCase()])

      const userAccount = await findAccountById(user.accountId)

      await getModel<AdminRequest>('admin_request').destroy({ where: { hin: userAccount?.hin! } }),
        {
          transaction: t,
        }
    } catch (e) {
      console.log(JSON.stringify(e))
      throw e
    }
  })
}
