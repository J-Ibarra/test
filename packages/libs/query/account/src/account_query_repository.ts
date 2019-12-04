import { Account } from './../../../model/account/src/account/Account.interface'
import { wrapInTransaction } from '../../../util/db-connector/src/sequelize-setup/transaction_wrapper'
import { Transaction } from 'sequelize'
import sequelize, { getModel } from '@abx/db-connection-utils'
import { User } from 'libs/model/account/src/user/User.interface'

export async function findAccountById(id: string, t?: Transaction): Promise<Account> {
  return wrapInTransaction(sequelize, t, async tran => {
    const account = await getModel<Account>('account').findOne({
      where: { id },
      transaction: tran,
    })

    return account ? account.get() : null
  })
}

export async function findAccountWithUserDetails(accountQuery: Partial<Account>, t?: Transaction): Promise<Account> {
  return wrapInTransaction(sequelize, t, async tran => {
    const account = await getModel<Account>('account').findOne({
      where: { ...accountQuery },
      transaction: tran,
      include: [
        {
          model: getModel<User>('user'),
          as: 'users',
        },
      ],
    })

    return account ? account.get() : null
  })
}

export async function findAccountsByIdWithUserDetails(id: string[], t?: Transaction): Promise<Account[]> {
  return wrapInTransaction(sequelize, t, async tran => {
    const accountInstances = await getModel<Account>('account').findAll({
      where: { id },
      transaction: tran,
      include: [
        {
          model: getModel<User>('user'),
          as: 'users',
        },
      ],
    })

    return accountInstances.map(accountInstance => accountInstance.get())
  })
}

/**
 * Returns an account's suspended status
 *
 * @param accountId The account ID to check against
 */
export async function hasAccountSuspended(accountId: string): Promise<boolean> {
  const account = await findAccountById(accountId)

  return account && !account.suspended ? account.suspended : true
}

export async function findUserByIdWithAccount(id: string) {
  const user = await getModel<User>('user').findOne({
    where: { id },
    include: [{ model: getModel<Account>('account'), as: 'account' }],
  })
  return user ? user.get() : null
}
