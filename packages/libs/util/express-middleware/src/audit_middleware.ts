import { NextFunction, Response } from 'express'
import { recordCustomEvent } from 'newrelic'
import { OverloadedRequest } from '@abx-types/account'

interface IApiAccessAttributes {
  ip: string
  user_id?: string
  account_id?: string
  session_id?: string
  path: string
  method: string
  access_time: Date
}

export function auditMiddleware(req: OverloadedRequest, _res: Response, next: NextFunction) {
  const ip = req['clientIp']
  const user = req.user
  const session = req.session
  const account = req.account

  const attributes: IApiAccessAttributes = {
    ip,
    path: req.path,
    method: req.method,
    access_time: new Date(),
  }

  if (user) {
    attributes.user_id = user.id
  }

  if (account) {
    attributes.account_id = account.id
  }

  if (session) {
    attributes.session_id = session.id
  }

  recordCustomEvent('event_ke_user_audit', attributes as any)

  return next()
}
