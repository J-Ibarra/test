import { Transaction } from 'sequelize'

/**
 * interface for calls to @link {`cancelWithdrawal`} handler
 */
export interface WithdrawalCancelParams {
  id: number
  transaction?: Transaction
}
