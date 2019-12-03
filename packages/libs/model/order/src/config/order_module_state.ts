import { SymbolPairSummary } from '../core/symbol_pair_summary'
import { DepthState } from './depth_state'
import { HandlerState } from './handler_state'

export interface OrderModuleState {
  symbols?: SymbolPairSummary[]
  depth?: DepthState
  handler?: HandlerState
}
