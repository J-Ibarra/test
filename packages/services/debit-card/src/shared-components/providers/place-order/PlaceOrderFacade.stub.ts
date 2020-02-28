import { PlaceOrderFacade } from './PlaceOrderFacade'

export class PlaceOrderFacadeStub implements PlaceOrderFacade {
  constructor(private response = Promise.resolve(3452)) {}

  public createSellMarketOrder(): Promise<number> {
    return this.response
  }
}
