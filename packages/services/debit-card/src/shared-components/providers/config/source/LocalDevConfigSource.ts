import {
  DbConfig,
  LogLevel,
  ContisConfiguration,
  CookieCryptoParams,
  JwtConfig,
  RedisConfig,
  CurrencyCode,
  ContisLogin,
} from '../../../models'
import { ConfigSource } from './ConfigSource'

export class LocalDevConfigSource implements ConfigSource {
  constructor() {
    process.env.ENV = 'dev'
  }

  public getExchangeDbConfig(): DbConfig {
    return {
      host: 'localhost',
      port: 6432,
      username: 'postgres',
      password: '',
      database: 'kinesis_exchange',
    }
  }

  public getDebitCardDbConfig(): DbConfig {
    return {
      host: 'localhost',
      port: 5433,
      username: 'postgres',
      password: 'postgres',
      database: 'db',
    }
  }

  public getUserInterfaceDomain(): string {
    return 'http://localhost:1234'
  }

  public getLogLevel(): LogLevel {
    return LogLevel.debug
  }

  public getContisLogin(currency: CurrencyCode): ContisLogin {
    return {
      username: `KIN${currency}_beta`,
      password: currency === CurrencyCode.EUR ? 'myaqcd34' : 'xtvvvb33',
    }
  }

  public getContisConfig(): ContisConfiguration {
    return {
      apiRoot: 'https://sandboxapi.contis.com',
      cardOrderFee: 5,
      webhookWhitelistedIP: '127.0.0.1',
      cardOrderValidationSLAInMinutes: 5,
      contisNotificationQueueUrl: '',
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
      port: 7379,
    }
  }
}
