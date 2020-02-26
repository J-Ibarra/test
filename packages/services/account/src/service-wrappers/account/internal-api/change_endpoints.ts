import { createAccount } from '../../../core'
import { AccountChangeEndpoints } from '@abx-service-clients/account'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createChangeEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: AccountChangeEndpoints.createAccount,
      handler: ({ email, password }) => createAccount({ email, password }),
    },
  ]
}
