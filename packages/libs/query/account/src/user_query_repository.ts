import { User, Account, UserPublicView } from '@abx-types/account'
import { sequelize, wrapInTransaction, getModel } from '@abx/db-connection-utils'
import { Transaction } from 'sequelize'

export async function findUserByEmail(email: string, trans?: Transaction): Promise<User | null> {
  return findUser({ email }, false, trans)
}

export async function findUserByEmailWithAccount(email: string, trans?: Transaction): Promise<User | null> {
  return findUser({ email }, true, trans)
}

export async function findUserById(id: string, trans?: Transaction) {
  return wrapInTransaction(sequelize, trans, async t => {
    const user = await getModel<User>('user').findOne({ where: { id }, transaction: t })
    return user ? user.get() : null
  })
}

export function findUserPublicView(id: string, trans?: Transaction): Promise<UserPublicView> {
  return wrapInTransaction(sequelize, trans, async t => {
    const user = await getModel<User>('user').findOne({ where: { id }, transaction: t })
    return user ? user.get('publicView') : null
  })
}
export async function findUserByAccountId(accountId: string, trans?: Transaction) {
  return wrapInTransaction(sequelize, trans, async t => {
    const user = await getModel<User>('user').findOne({ where: { accountId }, transaction: t })
    return user ? user.get() : null
  })
}

export async function findUserByIdWithAccount(id: string) {
  const user = await getModel<User>('user').findOne({
    where: { id },
    include: [{ model: getModel<Account>('account'), as: 'account' }],
  })
  return user ? user.get() : null
}

export async function findUsersByAccountId(accountId: string, trans?: Transaction): Promise<User[]> {
  const users = await getModel<User>('user').findAll({ where: { accountId }, transaction: trans })
  return users.map(user => user.get())
}

async function findUser(criteria: Partial<User>, includeAccountDetails: boolean, trans?: Transaction): Promise<User | null> {
  return wrapInTransaction(sequelize, trans, async t => {
    const user = await getModel<User>('user').findOne({
      where: { ...criteria } as any,
      transaction: t,
      include: includeAccountDetails ? [getModel<Account>('account')] : [],
    })

    return user ? user.get() : null
  })
}
