import { Logger } from '@abx-utils/logging'
import { Session, User, OverloadedRequest } from '@abx-types/account'

import * as crypto from 'crypto'
import * as express from 'express'
import { get } from 'lodash'

import { apiCookieSecret, apiCookieIv, findSession, findAccountById, JwtTokenHandler, findUserByIdWithAccount } from '@abx-utils/account'

const logger = Logger.getInstance('express-middleware', 'Request Overloads')
const algo = 'aes-256-ctr'

export async function overloadRequestWithSessionInfo(
  request: OverloadedRequest,
  _: express.Response = {} as any,
  next: () => void = () => ({}),
): Promise<any> {
  const encryptedSession = get(request, 'cookies.appSession')
  const apiTokenPresent = request.header('Authorization')

  if (encryptedSession) {
    await enrichRequestWithSessionDetails(encryptedSession, request)
  } else if (apiTokenPresent) {
    await enrichRequestWithApiTokenAccountDetails(request)
  }

  await encrichRequestQueryParameters(request)

  next()
}

const encrichRequestQueryParameters = async (request: OverloadedRequest): Promise<void> => {
  const { query } = request
  request.where = {}

  if (!query) {
    return
  }

  const queryKeys = Object.keys(query)

  if (!queryKeys) {
    return
  }

  queryKeys.forEach(key => {
    const value = query[key]
    const [field, op] = key.split('_')

    if (!op) {
      request.where![field] = value
    } else {
      const opValue = value.includes(',') ? value.split(',') : value

      request.where![field] = {
        // Although Sequelize string based operators are deprecated,
        // generate one here as Symbols don't play nicely with Epicurus.
        [`$${op}`]: opValue,
      }
    }
  })
}

const enrichRequestWithSessionDetails = async (encryptedSession: string, request: OverloadedRequest): Promise<void> => {
  const decipher = crypto.createDecipheriv(algo, apiCookieSecret, apiCookieIv)
  let sessionId = decipher.update(encryptedSession, 'hex', 'utf8')
  sessionId += decipher.final('utf8')

  let session: Session | null
  let userAndAccount: User | null

  try {
    session = await findSession(sessionId)
  } catch (e) {
    logger.error(`session: e = ${JSON.stringify(e)}`)
    return
  }

  request.session = session!
  try {
    userAndAccount = await findUserByIdWithAccount(session!.userId)

    request.user = userAndAccount!
    request.account = userAndAccount!.account as any
  } catch (e) {
    logger.error(`userAndAccount: e = ${JSON.stringify(e)}`)
    return
  }
}

const enrichRequestWithApiTokenAccountDetails = async (request: OverloadedRequest): Promise<void> => {
  const token = request.header('Authorization')

  const result = new JwtTokenHandler().verifyToken(token!)
  request.account = await findAccountById(result.claims!.accountId)
}
