import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { WithdrawalProcessorEndpoints } from './endpoints'
import { CurrencyCode } from '@abx-types/reference-data'

export const WITHDRAWAL_PROCESSOR_SERVICE_PORT = 3115

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(WITHDRAWAL_PROCESSOR_SERVICE_PORT)

export function completeFiatWithdrawal(adminRequestId: number, fee: number) {
  return internalApiRequestDispatcher.fireRequestToInternalApi<
    { withdrawalRequestId: number; withdrawalFee: number; feeCurrencyCode: CurrencyCode }[]
  >(WithdrawalProcessorEndpoints.completeFiatWithdrawal, { adminRequestId, fee })
}
