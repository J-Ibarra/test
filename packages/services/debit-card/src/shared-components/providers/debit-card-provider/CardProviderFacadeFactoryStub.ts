import { CardProviderFacade } from './CardProviderFacade'
import { CurrencyCode } from '../../../shared-components/models'
import { ContisClientStub, AESEncryptionService } from '../contis-integration'
import { ContisCardProviderFacade } from './ContisCardProviderFacade'
import { ContisQueryHandler } from './contis/ContisQueryHandler'
import { ContisUpdateHandler } from './contis/ContisUpdateHandler'

export class CardProviderFacadeFactoryStub {
  private contisCardProviderFacadeStub: ContisCardProviderFacade

  constructor(contisClientStub: ContisClientStub) {
    const contisQueryHandler = new ContisQueryHandler(contisClientStub as any, new AESEncryptionService())
    const contisUpdateHandler = new ContisUpdateHandler(contisClientStub as any)

    this.contisCardProviderFacadeStub = new ContisCardProviderFacade(contisQueryHandler, contisUpdateHandler)
  }

  getCardProvider(currency: CurrencyCode): CardProviderFacade {
    switch (currency) {
      case CurrencyCode.EUR:
      case CurrencyCode.GBP:
        return this.contisCardProviderFacadeStub
      default:
        throw Error(`Currency ${currency} not supported`)
    }
  }
}
