import { NextFunction, Response } from 'express'
import { getApiCacheClient } from '@abx/db-connection-utils'
import { OverloadedRequest } from '@abx-types/account'

export async function maintenanceMiddleware(_req: OverloadedRequest, _res: Response, next: NextFunction): Promise<any> {
  const client = getApiCacheClient()
  const maintenanceActive = Number(await client.get<string>('maintenance'))
  if (!!maintenanceActive) {
    return _res.status(503).send({
      error: 'The system is down for maintenance',
    })
  }

  next()
}
