import { TradeTransaction } from './trade_transaction'

export interface TransactionWithUrl extends TradeTransaction {
  reportUrl: string
}
