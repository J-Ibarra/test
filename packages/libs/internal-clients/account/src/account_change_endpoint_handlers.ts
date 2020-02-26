import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { ACCOUNT_REST_API_PORT } from './query_endpoint_handlers'
import { AccountChangeEndpoints } from './endpoints'
import { Account } from '@abx-types/account'

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(ACCOUNT_REST_API_PORT)

export function createAccount(email: string, password: string): Promise<Account> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Account>(AccountChangeEndpoints.createAccount, { email, password })
}
