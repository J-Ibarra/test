import { EmailAttachment } from '@abx-types/notification'
import { ReportRequestData, generateReport } from '@abx-service-clients/report'

export function generateReportRequest(reportRequest: ReportRequestData): Promise<EmailAttachment[]> {
  return generateReport(reportRequest)
}
