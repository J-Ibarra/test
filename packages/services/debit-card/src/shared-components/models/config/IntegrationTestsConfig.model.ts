import { ContisEndpointPath, BalanceReserveFacadeStub } from '../../providers'
import { PlaceOrderFacadeStub } from '../../providers/place-order/PlaceOrderFacade.stub'

export interface IntegrationTestsConfig {
  setNotVerifiedUser?: boolean
  rejectRequest?: Map<ContisEndpointPath, boolean>
  placeOrderStub?: PlaceOrderFacadeStub
  balanceReserveFacadeStub?: BalanceReserveFacadeStub
}
