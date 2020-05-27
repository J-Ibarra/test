import { v4 } from 'node-uuid'
import * as bcrypt from 'bcryptjs'
import { Transaction } from 'sequelize'
import * as crypto from 'crypto'

import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { ValidationError } from '@abx-types/error'
import { User, AccountType, CreateAccountRequest, AccountStatus, Account, EmailValidationError, CreateUserRequest, Session } from '@abx-types/account'

import { findUserByEmail } from '../user_query_repository'
import moment from 'moment'
import { apiCookieSecret, apiCookieIv } from '../cookie_secrets'

import { UserPhoneDetails } from '@abx-types/account'

export const TEST_PASSWORD = 'testPass123414'
export const TEST_UUIDPHONE = 'QWERTYASDFGZXCCV'

export async function createTemporaryTestingAccount(accountType: AccountType = AccountType.individual, transaction?: Transaction): Promise<Account> {
  const account = await createAccount(
    { firstName: 'fn', lastName: 'ln', email: `${v4()}@abx.com`, password: TEST_PASSWORD, uuidPhone: TEST_UUIDPHONE },
    accountType,
    transaction,
  )

  await new Promise((resolve) => setTimeout(() => resolve(), 100))

  return account
}

async function createAccount(
  newAccount: CreateAccountRequest,
  type: AccountType = AccountType.individual,
  parentTransaction?: Transaction,
): Promise<Account> {
  return wrapInTransaction(sequelize, parentTransaction, async (transaction) => {
    await validateUserEmail(newAccount.email, transaction)

    console.log(`Validated email`)
    const accountInst = await getModel<Account>('account').create(
      { id: v4(), type, status: AccountStatus.registered, suspended: false },
      { transaction },
    )
    const account = accountInst.get()

    console.log(`Created account ${account.id}`)
    const user = await createUser({ accountId: account.id, ...newAccount }, transaction)
    console.log(`Created user for account ${account.id}`)

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

async function createUser({ accountId, firstName, lastName, email, password }: CreateUserRequest, transaction?: Transaction): Promise<User> {
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
      {
        transaction,
      },
    )
    .then((u) => u.get('publicView'))
}

export async function createAccountAndSession(accountType: AccountType = AccountType.individual) {
  const result = await sequelize
    .transaction({
      autocommit: false,
      isolationLevel: sequelize.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      deferrable: sequelize.Sequelize.Deferrable.SET_DEFERRED,
    } as any)
    .then(async (transaction) => {
      const tempAcc = await createTemporaryTestingAccount(accountType, transaction)
      await getModel<Account>('account').update({ status: AccountStatus.kycVerified } as any, { where: { id: tempAcc.id }, transaction })
      const user: User = tempAcc.users![0]

      const cookie = await createCookie(user.id, transaction)
      console.log(`Created cookie ${cookie}`)

      transaction.commit()
      return { account: tempAcc, cookie: `appSession=${cookie}`, email: user.email, id: user.id }
    })

  await new Promise((resolve) => setTimeout(() => resolve(), 200))

  return result
}

async function createCookie(userId: string, t?: Transaction, sessionExpiryInHours: number = 12) {
  const session = await createSession(userId, t, sessionExpiryInHours)
  const cipher = crypto.createCipheriv('aes-256-ctr', apiCookieSecret, apiCookieIv)
  let crypted = cipher.update(session.id, 'utf8', 'hex')
  crypted += cipher.final('hex')

  return crypted
}

function createSession(userId: string, trans?: Transaction, cookieExpiryInHours: number = 12) {
  return wrapInTransaction(sequelize, trans, async (t) => {
    const expiry = moment().add(cookieExpiryInHours, 'hours').toDate()
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

export async function createUserTemporaryPhoneDetails(userId: string, uuidPhone: string, trans?: Transaction): Promise<UserPhoneDetails> {
  return wrapInTransaction(sequelize, trans, async (t) => {
    const phoneDetails = await getModel<UserPhoneDetails>('user_phone_details').create(
      {
        id: v4(),
        userId,
        uuidPhone,
      },
      {
        transaction: t,
      },
    )

    return phoneDetails.get()
  })
}
