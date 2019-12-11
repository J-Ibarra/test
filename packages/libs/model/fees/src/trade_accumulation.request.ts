import { Transaction } from 'sequelize'

export interface TradeAccumulationRequest {
  accountId: string
  symbolId: string
  amount: number
  price: number
  transaction: Transaction
  date: Date
}
