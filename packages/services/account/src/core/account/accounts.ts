import * as crypto from 'crypto'
import moment from 'moment'
import { v4 } from 'node-uuid'
import { Transaction } from 'sequelize'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { Email, EmailTemplates } from '@abx-types/notification'

import { Logger } from '@abx-utils/logging'
import { apiCookieIv, apiCookieSecret } from '@abx-utils/account'
import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'

import { ValidationError } from '@abx-types/error'
import { AccountPubSubTopics } from '@abx-service-clients/account'
import { createEmail } from '@abx-service-clients/notification'
// import { findCryptoCurrencies } from '@abx-service-clients/reference-data'
import { Account, AccountStatus, AccountType, CreateAccountRequest, KycStatusChange, User, UserPublicView } from '@abx-types/account'
import { findSession } from './session'
import { createAccountVerificationUrl, createUser, findUserByAccountId, findUserById, prepareWelcomeEmail, validateUserEmail } from '../users'
import { cancelAllOrdersForAccount } from '@abx-service-clients/order'
const logger = Logger.getInstance('accounts-service', 'accounts')

/**
 * Creates and account(and underlying user) based on details received.
 *
 * @param newAccount contains the the details for the account to be created
 * @param type the account type
 * @param parentTransaction an existing transaction to reuse
 * @throws {ValidationError} if account email invalid
 */
export function createAccount(
  newAccount: CreateAccountRequest,
  type: AccountType = AccountType.individual,
  parentTransaction?: Transaction,
): Promise<Account> {
  return wrapInTransaction(sequelize, parentTransaction, async transaction => {
    await validateUserEmail(newAccount.email)

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

export async function createAccountAndPrepareWelcomeEmail(
  newAccount: CreateAccountRequest,
  type: AccountType = AccountType.individual,
  transaction?: Transaction,
) {
  const epicurus = getEpicurusInstance()
  return wrapInTransaction(sequelize, transaction, async t => {
    const account = await createAccount(newAccount, type, t)
    const accountVerificationUrl = await createAccountVerificationUrl(account.users![0].id, t)

    const welcomeEmailContent = prepareWelcomeEmail(account.users![0], accountVerificationUrl, account.hin)

    logger.debug(`Publishing accountCreated event for account: ${JSON.stringify(account)}`)

    epicurus.publish(AccountPubSubTopics.accountCreated, account)

    return {
      account,
      welcomeEmailContent,
    }
  })
}

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

export async function findAllKycVerifiedAccountIds(): Promise<string[]> {
  const kycVerifiedAccountInstances = await getModel<Account>('account').findAll({
    where: { status: AccountStatus.kycVerified } as any,
  })

  return kycVerifiedAccountInstances.map(kycVerifiedAccountInstance => kycVerifiedAccountInstance.get().id)
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

export async function updateAccount(accountId: string, update: Partial<Account>, t?: Transaction): Promise<any> {
  return wrapInTransaction(sequelize, t, async tran => {
    const accountUpdateResult = await getModel<Account>('account').update(
      {
        ...update,
      } as any,
      {
        where: { id: accountId },
        transaction: tran,
        returning: true,
      },
    )

    logger.info(`Updated account ${accountId}`)

    const updatedAccounts = accountUpdateResult[1]
    return updatedAccounts[0].get()
  })
}

export async function recordKycCheckTriggered(accountId: string, t?: Transaction): Promise<any> {
  logger.info(`Recording KYC form submission for ${accountId}`)
  return updateAccount(accountId, { hasTriggeredKycCheck: true }, t)
}

export async function updateSuspensionStatus(request: { id: string; suspended: boolean }, t?: Transaction): Promise<any> {
  const updatedAccount = await updateAccount(request.id, { suspended: request.suspended }, t)

  const user = await findUserByAccountId(request.id)

  if (request.suspended) {
    await cancelAllOrdersForAccount(request.id)
    await sendAccountSuspensionEmail(user!)
  } else {
    await sendAccountReactivationEmail(user!)
  }

  return updatedAccount
}

export function sendAccountSuspensionEmail(user: User) {
  const emailRequest: Email = {
    to: user.email,
    subject: 'Account Suspension',
    templateName: EmailTemplates.AccountSuspension,
    templateContent: {
      name: user.firstName!,
    },
  }
  return createEmail(emailRequest)
}

export async function sendAccountReactivationEmail(user: User) {
  const emailRequest: Email = {
    to: user.email,
    subject: 'Account Re-Activated',
    templateName: EmailTemplates.AccountReactivated,
    templateContent: {
      name: user.firstName!,
    },
  }
  return createEmail(emailRequest)
}

/**
 * Flags the account for a user as verified, using the details in the verification token.
 * If the token has expired, a {@link ValidationError} is thrown.
 *
 * @param userToken the user verification token
 * @param trans an existing transaction to reuse if present
 * @throws {ValidationError} if the validation error has expired
 */
export async function verifyUserAccount(userToken: string, trans?: Transaction): Promise<UserPublicView & { status: AccountStatus }> {
  return wrapInTransaction(sequelize, trans, async transaction => {
    const decipher = crypto.createDecipheriv('aes-256-ctr', apiCookieSecret, apiCookieIv)

    let sessionId = decipher.update(userToken, 'hex', 'utf8')
    sessionId += decipher.final('utf8')
    const session = await findSession(sessionId, trans)

    if (moment().isBefore(session!.expiry)) {
      const user = await findUserById(session!.userId, transaction)

      const [, [updatedAccountInstance]] = await getModel<Partial<Account>>('account').update(
        { status: AccountStatus.emailVerified },
        {
          where: { id: user!.accountId },
          transaction,
          returning: true,
        },
      )

      // Publish for other services to work with
      getEpicurusInstance().publish(AccountPubSubTopics.accountVerified, { accountId: user!.accountId })

      const updatedAccount = updatedAccountInstance.get()
      const userPublicView: UserPublicView = {
        id: user!.id,
        accountId: user!.accountId,
        email: user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
        lastLogin: user!.lastLogin,
        mfaEnabled: !!user!.mfaSecret,
        accountType: updatedAccount.type!,
        status: updatedAccount.status!,
        hin: updatedAccount.hin!,
      }

      return userPublicView
    } else {
      throw new ValidationError('The verification link used has expired.')
    }
  })
}

/**
 * Returns an account's suspended status
 *
 * @param accountId The account ID to check against
 */
export async function isAccountSuspended(accountId: string): Promise<boolean> {
  const account = await findAccountById(accountId)

  return account && !account.suspended ? account.suspended : true
}

export async function updateAccountStatus(id: string, status: AccountStatus): Promise<void> {
  const updatedValues: Partial<Account> = {
    status,
  }

  if (status === AccountStatus.kycVerified) {
    updatedValues.hasTriggeredKycCheck = false

    const epicurus = getEpicurusInstance()

    epicurus.publish(AccountPubSubTopics.accountKycStatusChange, { accountId: id, status: KycStatusChange.approved })
  }

  await getModel<Partial<Account>>('account').update(updatedValues, {
    where: { id },
    returning: true,
  })
}
