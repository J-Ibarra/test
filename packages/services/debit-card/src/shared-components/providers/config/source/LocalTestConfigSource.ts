import {
  DbConfig,
  LogLevel,
  ContisConfiguration,
  CookieCryptoParams,
  JwtConfig,
  RedisConfig,
  ContisLogin,
} from '../../../models'
import { ConfigSource } from './ConfigSource'
import { TEST_CONTIS_QUEUE_URL } from '../../queue'

export class LocalTestConfigSource implements ConfigSource {
  public getExchangeDbConfig(): DbConfig {
    return {
      host: 'stubbed',
      port: 1111,
      username: 'stub',
      password: 'stub',
      database: 'stub',
    }
  }

  public getDebitCardDbConfig(): DbConfig {
    return {
      host: 'localhost',
      port: 5434,
      username: 'postgres',
      password: '',
      database: 'debit_card_db_test',
      customEntitiesLocation: ['src/app/**/*.entity{.ts,.js}', 'src/shared-components/**/*.entity{.ts,.js}'],
      customMigrationsLocation: 'dist/src/db-migrations/*.js',
      keepConnectionAlive: true,
    }
  }

  public getUserInterfaceDomain(): string {
    return 'http://localhost:1234'
  }

  public getLogLevel(): LogLevel {
    return LogLevel.debug
  }

  public getContisLogin(): ContisLogin {
    return {
      username: 'foo',
      password: 'bar',
    }
  }

  // Stub client will be used for tests, so dummy credentials are fine
  public getContisConfig(): ContisConfiguration {
    return {
      apiRoot: 'https://sandboxapi.contis.com',
      cardOrderFee: 5,
      webhookWhitelistedIP: '127.0.0.1',
      cardOrderValidationSLAInMinutes: 1,
      contisNotificationQueueUrl: TEST_CONTIS_QUEUE_URL,
    }
  }

  public getCookieCryptoParams(): CookieCryptoParams {
    return {
      cypherAlgorith: 'aes-256-ctr',
      cookieSecret: '7yH*clwZeD0Pq&WPSYE*Q!1x9HafSs@X',
      cookieIv: '67Jo*Jip5C8m6P%n',
    }
  }

  public getJwtConfig(): JwtConfig {
    return {
      secret: 'foo',
      algorithm: 'HS256',
    }
  }

  public getRedisConfig(): RedisConfig {
    return {
      host: 'localhost',
      port: 7380,
    }
  }
}
