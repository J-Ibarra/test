import { Environment } from '../../models'
import { LocalDevMonitoringService } from './LocalDevMonitoring.service'
import { MonitoringService } from './Monitoring.service'
import { NewrelicMonitoringService } from './NewrelicMonitoring.service'

export class MonitoringServiceFactory {
  static getMonitoringServiceForEnvironment(): MonitoringService {
    if (process.env.ENV === Environment.development) {
      return new NewrelicMonitoringService()
    }

    return new LocalDevMonitoringService()
  }
}
