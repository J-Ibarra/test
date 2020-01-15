import { v4 } from 'node-uuid'
import * as bcrypt from 'bcryptjs'
import { Transaction } from 'sequelize'
import * as crypto from 'crypto'

import { sequelize, getModel, wrapInTransaction } from '@abx/db-connection-utils'
import { ValidationError } from '@abx-types/error'
import { User, AccountType, CreateAccountRequest, AccountStatus, Account, EmailValidationError, CreateUserRequest, Session } from '@abx-types/account'

import { UserInstance } from '../model/user'
import { findUserByEmail } from '../user_query_repository'
import moment from 'moment'
import { apiCookieSecret, apiCookieIv } from '../cookie_secrets'

export const TEST_PASSWORD = 'testPass123414'

export function createTemporaryTestingAccount(accountType: AccountType = AccountType.individual): Promise<Account> {
  return createAccount({ firstName: 'fn', lastName: 'ln', email: `${v4()}@abx.com`, password: TEST_PASSWORD }, accountType)
}

async function createAccount(
  newAccount: CreateAccountRequest,
  type: AccountType = AccountType.individual,
  parentTransaction?: Transaction,
): Promise<Account> {
  await wrapInTransaction(sequelize, parentTransaction, async transaction => {
    return validateUserEmail(newAccount.email, transaction)
  })

  const accountInst = await getModel<Account>('account').create({ id: v4(), type, status: AccountStatus.registered, suspended: false })
  const account = accountInst.get()
  const user = await createUser({ accountId: account.id, ...newAccount })

  return {
    ...account,
    users: [user],
  }
}

async function validateUserEmail(email: string, trans: Transaction) {
  const userForEmail = await findUserByEmail(email.toLocaleLowerCase(), trans)

  if (!!userForEmail) {
    throw new ValidationError(EmailValidationError.emailTaken, { status: 409 })
  }
}

async function createUser({ accountId, firstName, lastName, email, password }: CreateUserRequest, trans?: Transaction): Promise<User> {
  const salt = await bcrypt.genSalt()
  const passwordHash = await bcrypt.hash(password, salt)
  return getModel<User>('user')
    .create({
      id: v4(),
      firstName,
      lastName,
      email: email.toLocaleLowerCase(),
      passwordHash,
      accountId,
    })
    .then((u: UserInstance) => u.get('publicView'))
}

export async function createAccountAndSession(accountType: AccountType = AccountType.individual) {
  const tempAcc = await createTemporaryTestingAccount(accountType)
  await getModel<Account>('account').update({ status: AccountStatus.kycVerified } as any, { where: { id: tempAcc.id } })
  const user: User = tempAcc.users![0]
  const cookie = await createCookie(user.id)

  return { account: tempAcc, cookie: `appSession=${cookie}`, email: user.email, id: user.id }
}

async function createCookie(userId: string, t?: Transaction, sessionExpiryInHours: number = 12) {
  const session = await createSession(userId, t, sessionExpiryInHours)
  const cipher = crypto.createCipheriv('aes-256-ctr', apiCookieSecret, apiCookieIv)
  let crypted = cipher.update(session.id, 'utf8', 'hex')
  crypted += cipher.final('hex')

  return crypted
}

function createSession(userId: string, trans?: Transaction, cookieExpiryInHours: number = 12) {
  return wrapInTransaction(sequelize, trans, async t => {
    const expiry = moment()
      .add(cookieExpiryInHours, 'hours')
      .toDate()
    const session = await getModel<Session>('session').create(
      {
        id: v4(),
        userId,
        expiry,
      },
      {
        transaction: t,
      },
    )

    return session.get()
  })
}
