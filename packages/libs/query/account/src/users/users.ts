import { Logger } from '@abx/logging'
import { User } from '../../../../model/account/src/user/'
import { getModel } from '@abx/db-connection-utils'
import { Transaction } from 'sequelize'

const logger = Logger.getInstance('api', 'bootstrap')

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
