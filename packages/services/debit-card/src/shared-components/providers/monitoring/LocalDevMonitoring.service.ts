import { MonitoringService } from './Monitoring.service'

/** This is a a stub used for local development where no monitoring is required. */
export class LocalDevMonitoringService implements MonitoringService {
  recordExecution(_: string, triggerExecution: () => Promise<any>): Promise<any> {
    return triggerExecution()
  }
}
