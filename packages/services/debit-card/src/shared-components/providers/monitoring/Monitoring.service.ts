export const MONITORING_SERVICE = 'monitoring-service'

/**
 * Defines the mechanism for gathering monitoring information.
 */
export interface MonitoringService {
  /**
   * Starts tracking the execution of a function/logic flow.
   *
   * @param identifier the identifier used for monitoring aggregation
   * @param triggerExecution the function triggering execution of the logic being recorded
   */
  recordExecution(identifier: string, triggerExecution: () => Promise<any>): Promise<any>
}
