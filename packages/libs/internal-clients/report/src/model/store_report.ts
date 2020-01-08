import { ReportType } from './enum/report_type'

export interface StoredReport {
    id?: number
    accountId: string
    reportType: ReportType
    s3Key: string
  }
  