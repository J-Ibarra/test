import { CurrencyCode } from '@abx-types/reference-data'
import { E2eTestingBalanceEndpoints } from './endpoints'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { BALANCE_REST_API_PORT } from '../balance-retrieval'

export interface AccountSetupBalance {
  amount: number
  currencyCode: CurrencyCode
}

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(BALANCE_REST_API_PORT)

export function setupAccountBalances(accountId: string, balances: AccountSetupBalance[]): Promise<void> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(E2eTestingBalanceEndpoints.setupAccountBalances, { balances, accountId })
}

export * from './endpoints'
