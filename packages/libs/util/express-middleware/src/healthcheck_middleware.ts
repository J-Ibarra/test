import { NextFunction, Response } from 'express'
import { OverloadedRequest } from '@abx-types/account'

export function healthcheckMiddleware(req: OverloadedRequest | any, _res: Response, next: NextFunction) {
  if (req.url.includes('/api/healthcheck')) {
    _res.status(200)
    return _res.send()
  }

  return next()
}
