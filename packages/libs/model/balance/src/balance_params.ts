import { BalanceChangeParams } from './balance_change_params'

export interface BalanceParams extends BalanceChangeParams {
  balanceTypeId: number
}
