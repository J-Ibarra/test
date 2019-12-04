import { BalanceChangeParams } from './balance_change_params'
import { ReserveAction } from './action'

export interface BalanceReserveInteraction extends BalanceChangeParams {
  action: ReserveAction
}
