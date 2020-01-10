import { OrderMatchData } from './order_match_data'
import { ReportType } from './enum/report_type'

export interface ReportRequestData {
    reportType: ReportType
    orderMatchData?: OrderMatchData
  }