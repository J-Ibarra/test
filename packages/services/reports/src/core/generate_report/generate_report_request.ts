import { EmailAttachment } from '@abx-types/notification'
import { generateReport, ReportRequest } from '@abx-service-clients/report'

export function generateReportRequest(reportRequest: ReportRequest): Promise<EmailAttachment[]> {
  return generateReport(reportRequest)
}
