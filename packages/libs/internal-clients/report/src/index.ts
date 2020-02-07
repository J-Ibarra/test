import { ReportEndpoints } from './endpoints'
import { ReportRequest } from './model'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { EmailAttachment } from '@abx-types/notification'

export const REPORT_REST_API_PORT = 3107
const internalApiRequestDispatcher = new InternalApiRequestDispatcher(REPORT_REST_API_PORT)

export function generateReport(data: ReportRequest): Promise<EmailAttachment[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<EmailAttachment[]>(ReportEndpoints.generateReport, { ...data })
}

export * from './endpoints'
export * from './model'
