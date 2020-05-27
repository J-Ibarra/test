import * as crypto from 'crypto'
import moment from 'moment'
import { v4 } from 'node-uuid'
import { Transaction } from 'sequelize'
import { apiCookieIv, apiCookieSecret } from '@abx-utils/account'
import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { Session, UserPublicView } from '@abx-types/account'
import { findAccountById } from './accounts'
import { findUserPublicView, updateUser } from '../users'

const algo = 'aes-256-ctr'

// 12 Hour Expiry by default
export async function createSession(userId: string, trans?: Transaction, cookieExpiryInHours: number = 12) {
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
export async function findSessionByUserId(userId: string, trans?: Transaction) {
  return wrapInTransaction(sequelize, trans, async t => {
    const session = await getModel<Session>('session').findOne({ where: { userId }, transaction: t })
    return session ? session.get() : null
  })
}

export async function findSession(id: string, transaction?: Transaction): Promise<Session | null> {
  const session = await getModel<Session>('session').findByPrimary(id, { transaction })

  return session ? session.get() : null
}

export async function createCookie(userId: string, t?: Transaction, sessionExpiryInHours: number = 12) {
  const session = await createSession(userId, t, sessionExpiryInHours)
  const cipher = crypto.createCipheriv(algo, apiCookieSecret, apiCookieIv)
  let crypted = cipher.update(session.id, 'utf8', 'hex')
  crypted += cipher.final('hex')
  return crypted
}

export async function killSession(id: string) {
  const killed = await getModel<Session>('session').update(
    {
      deactivated: true,
    } as Session,
    {
      where: { id },
      returning: true,
    },
  )
  return killed[1][0].get()
}

export async function createSessionForUser(userId: string, sessionExpiryInHours: number = 12) {
  return wrapInTransaction(sequelize, null, async transaction => {
    const sessionCookie = await createCookie(userId, transaction, sessionExpiryInHours)

    const userPublicView = await findUserPublicView(userId, transaction)

    const [accountForUser] = await Promise.all([
      findAccountById(userPublicView.accountId),
      updateUser({ id: userId, lastLogin: new Date() }, transaction),
    ])

    return {
      sessionCookie,
      user: {
        ...userPublicView,
        status: accountForUser!.status,
        accountType: accountForUser!.type,
        hin: accountForUser!.hin,
        hasTriggeredKycCheck: accountForUser!.hasTriggeredKycCheck,
      } as UserPublicView,
    }
  })
}
