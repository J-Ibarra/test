import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { ReportEndpoints } from './endpoints'
import { ReportRequest } from './model'

export function generateReport(data: ReportRequest) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(ReportEndpoints.generateReport, { data })
}

export * from './endpoints'
export * from './model'
