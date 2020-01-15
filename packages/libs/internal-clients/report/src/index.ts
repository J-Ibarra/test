import { getEpicurusInstance } from '@abx/db-connection-utils'
import { ReportEndpoints } from './endpoints'
import { ReportRequestData } from './model'

export function generateReport(data: ReportRequestData) {
  const epicurus = getEpicurusInstance()

  return epicurus.request(ReportEndpoints.generateReport, { data })
}

export * from './endpoints'
export * from './model'
