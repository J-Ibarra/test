import { AccountInfo } from '../account_info'
import { TradeTransactionData } from './trade_transaction_data'
import { TransactionFeeData } from './transaction_fee_data'
import { FooterData } from '../footer_data'

export interface TradeTransactionReportData {
    $staticResources: string
    account: AccountInfo
    tradeTransaction: TradeTransactionData
    transactionFee: TransactionFeeData
    footer: FooterData
  }