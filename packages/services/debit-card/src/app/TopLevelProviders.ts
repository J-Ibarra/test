import axios from 'axios'
import AuthGuard from '@abx/ke-auth-lib'
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core'

import {
  MONITORING_SERVICE,
  MonitoringRequestInterceptor,
  MonitoringServiceFactory,
  ConfigSourceFactory,
  AESEncryptionService,
  CONFIG_SOURCE_TOKEN,
  RedisFacade,
  SYNCHRONOUS_REDIS_CLIENT,
  createSynchronousRedisClient,
  USER_DETAILS_FACADE_TOKEN,
  ExchangeUserDetailsFacade,
  BALANCE_RESERVE_FACADE_TOKEN,
  BalanceReserveFacade,
  ASYNCHRONOUS_REDIS_CLIENT,
  createAsynchronousRedisClient,
  CONTIS_AXIOS_INSTANCE_TOKEN,
  ENCRYPTION_SERVICE,
} from '../shared-components/providers'
import { RolesGuard, RequestValidationAdapter, RolesGuardStub } from '../shared-components/guards'
import { TestUserDetailsProvider } from '../shared-components/providers/user-details/TestUserDetailsProvider'

export const authGuardFactory = () => {
  const envConfig = ConfigSourceFactory.getConfigSourceForEnvironment()

  return new AuthGuard({
    dbConfig: envConfig.getExchangeDbConfig(),
    cookieCryptoParams: envConfig.getCookieCryptoParams(),
    jwtConfig: envConfig.getJwtConfig(),
  })
}

export const contisAxiosInstanceFactory = () => {
  const envConfig = ConfigSourceFactory.getConfigSourceForEnvironment()

  return axios.create({
    baseURL: `${envConfig.getContisConfig().apiRoot}`,
    timeout: 20_000,
  })
}

export const TOP_LEVEL_PROVIDERS = [
  {
    provide: MONITORING_SERVICE,
    useValue: MonitoringServiceFactory.getMonitoringServiceForEnvironment(),
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: MonitoringRequestInterceptor,
  },
  {
    provide: APP_GUARD,
    useFactory: (ref, requestValidationAdapter, topUserDetailsProvider) =>
      process.env.ENV === 'TEST' || process.env.ENV === 'CI'
        ? new RolesGuardStub(topUserDetailsProvider)
        : new RolesGuard(ref, requestValidationAdapter),
    inject: [Reflector, RequestValidationAdapter, TestUserDetailsProvider],
  },
  {
    provide: CONTIS_AXIOS_INSTANCE_TOKEN,
    useFactory: contisAxiosInstanceFactory,
  },
  {
    provide: ENCRYPTION_SERVICE,
    useClass: AESEncryptionService,
  },
  {
    provide: CONFIG_SOURCE_TOKEN,
    useValue: ConfigSourceFactory.getConfigSourceForEnvironment(),
  },
  {
    provide: SYNCHRONOUS_REDIS_CLIENT,
    useValue: createSynchronousRedisClient(ConfigSourceFactory.getConfigSourceForEnvironment().getRedisConfig()),
  },
  {
    provide: ASYNCHRONOUS_REDIS_CLIENT,
    useValue: createAsynchronousRedisClient(ConfigSourceFactory.getConfigSourceForEnvironment().getRedisConfig()),
  },
  {
    provide: USER_DETAILS_FACADE_TOKEN,
    useValue: ExchangeUserDetailsFacade,
  },
  {
    provide: BALANCE_RESERVE_FACADE_TOKEN,
    useClass: BalanceReserveFacade,
  },
  RedisFacade,
  RequestValidationAdapter,
  TestUserDetailsProvider,
]
