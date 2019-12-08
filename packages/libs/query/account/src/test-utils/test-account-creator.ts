import { v4 } from 'node-uuid'
import * as bcrypt from 'bcryptjs'
import { Transaction } from 'sequelize'

import { sequelize, getModel, wrapInTransaction } from '@abx/db-connection-utils'
import { ValidationError } from '@abx-types/error'
import { User, AccountType, CreateAccountRequest, AccountStatus, Account, EmailValidationError, CreateUserRequest } from '@abx-types/account'

import { UserInstance } from '../model/user'
import { findUserByEmail } from '../user_query_repository'

export const TEST_PASSWORD = 'testPass123414'

export async function createTemporaryTestingAccount(accountType: AccountType = AccountType.individual): Promise<Account> {
  return await createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@abx.com`, password: TEST_PASSWORD }, accountType)
}

function createAccount(
  newAccount: CreateAccountRequest,
  type: AccountType = AccountType.individual,
  parentTransaction?: Transaction,
): Promise<Account> {
  return wrapInTransaction(sequelize, parentTransaction, async transaction => {
    await validateUserEmail(newAccount.email, transaction)

    const accountInst = await getModel<Account>('account').create(
      { id: v4(), type, status: AccountStatus.registered, suspended: false },
      { transaction },
    )
    const account = accountInst.get()
    const user = await createUser({ accountId: account.id, ...newAccount }, transaction)

    return {
      ...account,
      users: [user],
    }
  })
}

async function validateUserEmail(email: string, trans: Transaction) {
  const userForEmail = await findUserByEmail(email.toLocaleLowerCase(), trans)

  if (!!userForEmail) {
    throw new ValidationError(EmailValidationError.emailTaken, { status: 409 })
  }
}

async function createUser({ accountId, firstName, lastName, email, password }: CreateUserRequest, trans?: Transaction): Promise<User> {
  return wrapInTransaction(sequelize, trans, async transaction => {
    const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(password, salt)
    return getModel<User>('user')
      .create(
        {
          id: v4(),
          firstName,
          lastName,
          email: email.toLocaleLowerCase(),
          passwordHash,
          accountId,
        },
        { transaction },
      )
      .then((u: UserInstance) => u.get('publicView'))
  })
}
