import { cleanOldMidPrices } from '@abx-service-clients/market-data'
import { cancelAllExpiredOrders } from '@abx-service-clients/order'
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { MarketDataTimeFrame } from '@abx-types/market-data'
import { Logger } from '@abx-utils/logging'
import { reconcileOHCLMarketData } from '@abx-service-clients/market-data'
import { AccountPubSubTopics } from '@abx-service-clients/account'

export function triggerMidPriceOlderThanOneDayCleanup(): Promise<void> {
  return cleanOldMidPrices()
}

export function triggerExpiredOrdersCancellation() {
  return cancelAllExpiredOrders()
}

export function publishAccountKycCheck() {
  const epicurus = getEpicurusInstance()
  epicurus.publish(AccountPubSubTopics.accountKycCheck, {})
}

const logger = Logger.getInstance('schedular', 'schedule_processors')

export const marketOHLCReconciliationTasks = Object.values(MarketDataTimeFrame)
  .filter(timeFrame => typeof timeFrame !== 'number')
  .map(timeFrame => ({
    name: `OHLCMarketDataReconciliation-timeFrame-${timeFrame}`,
    task: () => {
      logger.debug(`Running OHLCMarketDataReconciliation-timeFrame-${timeFrame}`)

      return reconcileOHCLMarketData(MarketDataTimeFrame[timeFrame] as any)
    },
  }))
