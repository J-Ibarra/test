import { NextFunction, Response } from 'express'
import { OverloadedRequest } from '@abx-types/account'
import { localAndTestEnvironments, getEnvironment, Environment } from '@abx-types/reference-data'

const localAndTestEnvsWithUat = localAndTestEnvironments.concat(Environment.uat)

export function e2eTestingEndpointGuard(req: OverloadedRequest | any, _res: Response, next: NextFunction) {
  if (req.url.includes('/api/test-automation') && !localAndTestEnvsWithUat.includes(getEnvironment())) {
    return _res.status(400).send('Bad request')
  }

  return next()
}
