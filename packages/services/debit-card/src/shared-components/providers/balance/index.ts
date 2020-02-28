import { BalanceReserveFacadeStub } from './BalanceReserveFacade.stub'
import { BalanceReserveFacade } from './BalanceReserveFacade'

export * from './BalanceReserveFacade'
export * from './BalanceReserveFacade.stub'
export * from './BalanceSourceOfTruthComparator'

export const balanceReserveFactory = () =>
  process.env.ENV === 'TEST' || process.env.ENV === 'CI' ? new BalanceReserveFacadeStub() : new BalanceReserveFacade()
