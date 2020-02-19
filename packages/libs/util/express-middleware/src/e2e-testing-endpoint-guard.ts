import { NextFunction, Response } from 'express'
import { OverloadedRequest } from '@abx-types/account'
import { e2eTestingEnvironments, getEnvironment } from '@abx-types/reference-data'

export function e2eTestingEndpointGuard(req: OverloadedRequest | any, _res: Response, next: NextFunction) {
  if (req.url.includes('/api/test-automation') && !e2eTestingEnvironments.includes(getEnvironment()))
  {
    return _res.status(400).send('Bad request');
  }

  return next()
}
