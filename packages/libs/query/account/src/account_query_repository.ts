import { Account, User } from '@abx-types/account'
import { Transaction } from 'sequelize'
import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'

export async function findAccountById(id: string, t?: Transaction): Promise<Account | null> {
  return wrapInTransaction(sequelize, t, async tran => {
    const account = await getModel<Account>('account').findOne({
      where: { id },
      transaction: tran,
    })

    return account ? account.get() : null
  })
}

export async function findAccountWithUserDetails(accountQuery: Partial<Account>, t?: Transaction): Promise<Account | null> {
  return wrapInTransaction(sequelize, t, async tran => {
    const account = await getModel<Account>('account').findOne({
      where: { ...accountQuery } as any,
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
