import { TradeTransactionReportData } from './transaction/trade_transaction_report_data'

export interface ReportData {
    data: TradeTransactionReportData
    identifier: number
    accountId: string
  }