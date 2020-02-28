import {
  USER_DETAILS_FACADE_TOKEN,
  ExchangeUserDetailsFacade,
  CONFIG_SOURCE_TOKEN,
  ConfigSourceFactory,
  CardProviderFacadeFactory,
  ENCRYPTION_SERVICE,
  AESEncryptionService,
  CONTIS_AXIOS_INSTANCE_TOKEN,
  CARD_PROVIDER_FACADE_FACTORY,
} from '../shared-components/providers'
import { contisAxiosInstanceFactory } from './TopLevelProviders'
import { ContisWebhookPushGuard } from '../shared-components/guards'

export const commonProviders = [
  ContisWebhookPushGuard,
  {
    provide: CONFIG_SOURCE_TOKEN,
    useValue: ConfigSourceFactory.getConfigSourceForEnvironment(),
  },
  {
    provide: USER_DETAILS_FACADE_TOKEN,
    useClass: ExchangeUserDetailsFacade,
  },
  {
    provide: ENCRYPTION_SERVICE,
    useClass: AESEncryptionService,
  },
  {
    provide: CONTIS_AXIOS_INSTANCE_TOKEN,
    useFactory: contisAxiosInstanceFactory,
  },
  {
    provide: CARD_PROVIDER_FACADE_FACTORY,
    useClass: CardProviderFacadeFactory,
  },
]
