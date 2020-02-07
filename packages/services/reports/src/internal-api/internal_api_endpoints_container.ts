import { createReportAndUploadToS3 } from '../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'
import { ReportEndpoints } from '@abx-service-clients/report'

export function createInternalApi(): InternalRoute<any, any>[] {
  return [
    {
      path: ReportEndpoints.generateReport,
      handler: ({ reportType, data }) => createReportAndUploadToS3({ reportType, data }),
    },
  ]
}
