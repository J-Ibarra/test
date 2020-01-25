import { getEpicurusInstance } from '@abx/db-connection-utils'
import { SettlementEndpoints } from './endpoints'

export function settleOrderMatch(id: number, feeCurrencyToUsdMidPrice: number): Promise<void> {
  const epicurus = getEpicurusInstance()

  return epicurus.request(SettlementEndpoints.settleOrderMatch, { id, feeCurrencyToUsdMidPrice })
}

export * from './endpoints'
