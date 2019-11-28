import { CoreOrderDetails } from '../core/core_order_details'
import { TradeTransaction } from './trade_transaction'

export interface OrderWithTradeTransactions extends CoreOrderDetails {
  transactions: TradeTransaction[]
}
