import { TradeTransactionReportData } from './transaction/trade_transaction_report_data'

export type ReportDataContent = TradeTransactionReportData

export interface ReportData {
  content: ReportDataContent
  identifier: number
  accountId: string
}
