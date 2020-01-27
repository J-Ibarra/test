import * as bcrypt from 'bcryptjs'
import { v4 } from 'node-uuid'
import * as validator from 'validator'

import { Transaction } from 'sequelize'
import { Logger } from '@abx-utils/logging'
import { getModel, sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { ValidationError } from '@abx-types/error'
import { Account, AccountType, CreateUserRequest, EmailValidationError, User, UserDetails, UserPublicView } from '@abx-types/account'
import { UserInstance } from '../models/user'
import { findAccountById, findAccountWithUserDetails } from '../account/accounts'

const logger = Logger.getInstance('api', 'bootstrap')

export async function createHashedPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt()
  return bcrypt.hash(password, salt)
}

export function validatePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Validates email format and makes sure the email has not already been taken.
 *
 * @param email the email to validate
 * @param trans an existing transaction to use
 * @throws {ValidationError} if validation fails
 */
export async function validateUserEmail(email: string, trans?: Transaction) {
  if (!validator.isEmail(email)) {
    logger.debug(`Unable to register user with invalid email: ${email}`)

    throw new ValidationError(EmailValidationError.emailInvalid)
  }

  const userForEmail = await findUserByEmail(email.toLocaleLowerCase(), trans)
  if (!!userForEmail) {
    logger.debug(`Tried to register user with email: ${email} but email has already been taken`)

    throw new ValidationError(EmailValidationError.emailTaken, { status: 409 })
  }
}

export async function createUser(
  { accountId, firstName, lastName, email, password, referrerHin }: CreateUserRequest,
  trans?: Transaction,
): Promise<User> {
  let referredBy: string
  if (!!referrerHin) {
    logger.debug(`Finding account to use as referrer with hin: ${referrerHin}`)

    const referrerAccount = await findAccountWithUserDetails({ hin: referrerHin })

    logger.debug(`Found referrer account with id: ${referrerAccount!.id}`)

    referredBy = referrerAccount!!.id
  }

  return wrapInTransaction(sequelize, trans, async transaction => {
    const passwordHash = await createHashedPassword(password)
    return getModel<User>('user')
      .create(
        {
          id: v4(),
          firstName,
          lastName,
          email: email.toLocaleLowerCase(),
          passwordHash,
          accountId,
          referredBy,
        },
        { transaction },
      )
      .then((u: UserInstance) => u.get('publicView'))
  })
}

export async function changePassword({ accountId, currentPassword, newPassword }) {
  return wrapInTransaction(sequelize, null, async transaction => {
    const user = await findUserByAccountId(accountId)
    const isCurrentPasswordValid = await validatePassword(currentPassword, user!.passwordHash)

    if (!isCurrentPasswordValid) {
      throw new ValidationError('The current password you entered does not match our records')
    }

    const newHashedPassword = await createHashedPassword(newPassword)

    const [, updatedInstance] = await updateUser(
      {
        id: user!.id,
        passwordHash: newHashedPassword,
      },
      transaction,
    )

    const updatedUser = updatedInstance[0].get('publicView')
    const { hin, status, suspended, type: accountType } = (await findAccountById(user!.accountId))!
    return {
      ...updatedUser,
      accountType,
      hin,
      status,
      suspended,
    } as UserPublicView
  })
}

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

/**
 * Validates the credentials for a user.
 *
 * @param email the email to validate
 * @param password the password to validate
 * @param trans an existing transaction to use
 * @throws {ValidationError} when input credentials do not match records
 */
export async function validateUserCredentials(email: string, password: string, trans?: Transaction): Promise<UserPublicView> {
  return wrapInTransaction(sequelize, trans, async t => {
    const formattedEmail = email.toLocaleLowerCase()
    const user = await findUserByEmailWithAccount(formattedEmail, t)
    if (!!user) {
      const isValid = await validatePassword(password, user.passwordHash)

      if (isValid) {
        return {
          id: user.id,
          accountType: user!.account!.type!,
          accountId: user.accountId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          lastLogin: user.lastLogin,
          mfaEnabled: !!user.mfaSecret,
          status: user!.account!.status,
          hin: user!.account!.hin!,
        }
      }
    }

    return Promise.reject(new ValidationError('Invalid user credentials'))
  })
}

export async function updateUser(request: Partial<User>, t?: Transaction): Promise<[number, UserInstance[]]> {
  return wrapInTransaction(sequelize, t, async transaction => {
    return (await getModel<User>('user').update(request as User, {
      where: { id: request.id } as any,
      transaction,
      returning: true,
    })) as any
  })
}

export function getNamesAndEmailsOfUsers(users: User[]): UserDetails[] {
  return users.map(({ firstName, lastName, email }) => ({ firstName, lastName, email }))
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

export async function findAllUsersForHin(hin: string, t?: Transaction): Promise<UserPublicView[]> {
  const userInstances = await getModel<User>('user').findAll({
    transaction: t,
    include: [
      {
        model: getModel<Account>('account'),
        as: 'account',
        where: {
          $or: [{ hin: { $like: `${hin}%` } }],
          type: { $ne: AccountType.admin },
        },
      },
    ],
  })

  return userInstances.map(user => ({
    ...user.get('publicView'),
    hin: (user as any).account.hin,
  }))
}
