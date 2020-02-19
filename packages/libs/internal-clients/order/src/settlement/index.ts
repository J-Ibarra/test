import { SettlementEndpoints } from './endpoints'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'

export const SETTLEMENT_API_ROOT = 3113

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(SETTLEMENT_API_ROOT)

export function settleOrderMatch(id: number, feeCurrencyToUsdMidPrice: number, symbolId: string): Promise<void> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<void>(SettlementEndpoints.settleOrderMatch, { id, feeCurrencyToUsdMidPrice, symbolId })
}

export * from './endpoints'
