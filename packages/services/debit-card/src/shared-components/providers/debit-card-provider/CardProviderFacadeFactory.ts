import { CardProviderFacade } from './CardProviderFacade'
import { ContisCardProviderFacade } from './ContisCardProviderFacade'
import { Injectable, Inject } from '@nestjs/common'
import { CurrencyCode } from '../../models'
import { ContisQueryHandler } from './contis/ContisQueryHandler'
import { ContisUpdateHandler } from './contis/ContisUpdateHandler'
import {
  ENCRYPTION_SERVICE,
  AESEncryptionService,
  CONTIS_AXIOS_INSTANCE_TOKEN,
  DefaultContisClient,
} from '../contis-integration'
import { CONFIG_SOURCE_TOKEN, ConfigSource } from '../config'
import { AxiosInstance } from 'axios'

export const CARD_PROVIDER_FACADE_FACTORY = 'card-provider-facade-factory'

@Injectable()
export class CardProviderFacadeFactory {
  private contisEuroCardProviderFacade: ContisCardProviderFacade
  private contisGbpCardProviderFacade: ContisCardProviderFacade

  constructor(
    @Inject(ENCRYPTION_SERVICE) private encryptionService: AESEncryptionService,
    @Inject(CONFIG_SOURCE_TOKEN) private configSource: ConfigSource,
    @Inject(CONTIS_AXIOS_INSTANCE_TOKEN) private axiosInstance: AxiosInstance,
  ) {
    this.contisEuroCardProviderFacade = this.createContisFacadeForCurrency(CurrencyCode.EUR)
    this.contisGbpCardProviderFacade = this.createContisFacadeForCurrency(CurrencyCode.GBP)
  }

  getCardProvider(currency: CurrencyCode): CardProviderFacade {
    switch (currency) {
      case CurrencyCode.EUR:
        return this.contisEuroCardProviderFacade
      case CurrencyCode.GBP:
        return this.contisGbpCardProviderFacade
      default:
        throw Error(`Currency ${currency} not supported`)
    }
  }

  private createContisFacadeForCurrency(currency: CurrencyCode): ContisCardProviderFacade {
    const contisClient = new DefaultContisClient(
      currency,
      this.encryptionService,
      this.configSource,
      this.axiosInstance,
    )
    const contisQueryHandler = new ContisQueryHandler(contisClient, this.encryptionService)
    const contisUpdateHandler = new ContisUpdateHandler(contisClient)

    return new ContisCardProviderFacade(contisQueryHandler, contisUpdateHandler)
  }
}
