import newrelic from 'newrelic'

import { MonitoringService } from './Monitoring.service'

/** This is a a stub used for local development where no monitoring is required. */
export class NewrelicMonitoringService implements MonitoringService {
  /** Records a web transaction in Newrelic using the identifier. (usually the request url) */
  recordExecution(
    identifier: string,
    triggerExecution: () => Promise<any>,
  ): Promise<any> {
    return newrelic.startWebTransaction(identifier, async () => {
      const monitoringTransaction = newrelic.getTransaction()

      try {
        const result = await triggerExecution()
        return result
      } catch (e) {
        newrelic.noticeError(e)
        throw e
      } finally {
        monitoringTransaction.end()
      }
    })
  }
}
