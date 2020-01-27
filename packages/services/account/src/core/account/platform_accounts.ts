import { v4 } from 'node-uuid'
import { Transaction } from 'sequelize'

import { getModel } from '@abx-utils/db-connection-utils'
import { Account, AccountStatus, AccountType } from '@abx-types/account'
import { findAccountWithUserDetails } from './accounts'

// TODO THIS NEEDS TO BE CONFIRMED, used when sending emails to OPS (e.g fiat withdrawal request)
export const operationsEmail = 'operations@abx.com'

const platformAccounts = {
  [AccountType.operator]: null,
  [AccountType.kinesisRevenue]: null,
}

interface FindOrCreatePlatformAccountParams {
  // This is useful in tests
  forceRefresh?: boolean
  transaction?: Transaction
}

// We can only have one operational account. This account does not have a user
// as it is only used to store fee revenue used for yield pool distribution
export async function findOrCreateOperatorAccount({ forceRefresh, transaction }: FindOrCreatePlatformAccountParams = {}): Promise<Account> {
  return findOrCreateAccount(forceRefresh, AccountType.operator, transaction)
}

export async function findOrCreateKinesisRevenueAccount({ forceRefresh, transaction }: FindOrCreatePlatformAccountParams = {}): Promise<Account> {
  return findOrCreateAccount(forceRefresh, AccountType.kinesisRevenue, transaction)
}

export async function findOrCreateAccount(forceRefresh, type: AccountType, t?: Transaction): Promise<Account> {
  if (!forceRefresh && !!platformAccounts[type]) {
    return platformAccounts[type]
  }

  let platformAccount = await findAccountWithUserDetails({ type }, t)

  if (!platformAccount) {
    platformAccount = await createAccount(type, t!)
  }

  platformAccount[type] = platformAccount

  return platformAccount
}

async function createAccount(type: AccountType, t: Transaction) {
  const account = await getModel<Account>('account').create(
    { id: v4(), type, status: AccountStatus.registered, suspended: false },
    { transaction: t },
  )

  return account.get()
}
