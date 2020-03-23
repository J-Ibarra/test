import { DbConfig, LogLevel, ContisConfiguration, CookieCryptoParams, JwtConfig, RedisConfig, ContisLogin } from '../../../models'
import { ConfigSource } from './ConfigSource'
import { TEST_CONTIS_QUEUE_URL } from '../../queue'

export class LocalE2eTestConfigSource implements ConfigSource {
  public getExchangeDbConfig(): DbConfig {
    return {
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '',
      database: 'kinesis_exchange',
    }
  }

  public getDebitCardDbConfig(): DbConfig {
    return {
      host: 'localhost',
      port: 5434,
      username: 'postgres',
      password: '',
      database: 'debit_card',
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
      apiRoot: 'http://localhost:9001',
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
      secret: 'test',
      algorithm: 'HS256',
    }
  }

  public getRedisConfig(): RedisConfig {
    return {
      host: process.env.REDIS_DB_HOST || 'redis',
      port: process.env.REDIS_DB_PORT ? Number(process.env.REDIS_DB_PORT) : 6379,
    }
  }
}
