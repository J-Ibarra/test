import { ReportType } from './enum/report_type'
import { ReportData } from './report_data'

export interface ReportRequest {
  reportType: ReportType
  data: ReportData
}
