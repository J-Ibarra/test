import * as Joi from '@hapi/joi'

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

export class DeployedEnvironmentConfigSource implements ConfigSource {
  public getExchangeDbConfig(): DbConfig {
    return this.validateConfig<DbConfig>(
      Joi.object({
        host: Joi.string(),
        port: Joi.any(),
        username: Joi.string(),
        password: Joi.string(),
        database: Joi.string(),
      }),
      {
        host: process.env.EXCHANGE_DB_HOST,
        port: parseInt(process.env.EXCHANGE_DB_PORT!, 10),
        username: process.env.EXCHANGE_DB_USERNAME,
        password: process.env.EXCHANGE_DB_PASSWORD,
        database: process.env.EXCHANGE_DB_NAME,
      },
    )
  }

  public getDebitCardDbConfig(): DbConfig {
    const dbCredentialsConfig = this.validateConfig<DbConfig>(
      Joi.object({
        host: Joi.string(),
        port: Joi.any(),
        username: Joi.string(),
        password: Joi.string(),
        database: Joi.string(),
      }),
      {
        host: process.env.DEBIT_CARD_DB_HOST,
        port: parseInt(process.env.DEBIT_CARD_DB_PORT!, 10),
        username: process.env.DEBIT_CARD_DB_USERNAME,
        password: process.env.DEBIT_CARD_DB_PASSWORD,
        database: process.env.DEBIT_CARD_DB_NAME,
      },
    )

    return {
      ...dbCredentialsConfig,
      customEntitiesLocation: ['dist/app/**/*.entity{.ts,.js}', 'dist/shared-components/**/*.entity{.ts,.js}'],
      customMigrationsLocation: 'dist/db-migrations/*.js',
    }
  }

  public getUserInterfaceDomain(): string {
    return this.validateConfig<{ domain: string }>(
      Joi.object({
        domain: Joi.string(),
      }),
      {
        domain: process.env.UI_DOMAIN,
      },
    ).domain
  }

  public getLogLevel(): LogLevel {
    return this.validateConfig<{ logLevel: LogLevel }>(
      Joi.object({
        logLevel: Joi.string(),
      }),
      {
        logLevel: process.env.LOG_LEVEL,
      },
    ).logLevel
  }

  public getContisLogin(currency: CurrencyCode): ContisLogin {
    return this.validateConfig<ContisLogin>(
      Joi.object({
        username: Joi.string(),
        password: Joi.string(),
      }),
      {
        username: process.env[`CONTIS_${currency}_USERNAME`],
        password: process.env[`CONTIS_${currency}_PASSWORD`],
      },
    )
  }

  public getContisConfig(): ContisConfiguration {
    return this.validateConfig<ContisConfiguration>(
      Joi.object({
        apiRoot: Joi.string(),
        cardOrderFee: Joi.number(),
        webhookWhitelistedIP: Joi.string(),
        cardOrderValidationSLAInMinutes: Joi.number(),
        contisNotificationQueueUrl: Joi.string(),
      }),
      {
        apiRoot: process.env.CONTIS_API_ROOT,
        cardOrderFee: process.env.CONTIS_CARD_ORDER_FEE,
        webhookWhitelistedIP: process.env.CONTIS_WEBHOOK_WHITELISTED_IP,
        cardOrderValidationSLAInMinutes: process.env.CONTIS_CARD_ORDER_VALIDATION_SLA,
        contisNotificationQueueUrl: process.env.CONTIS_NOTIFICATION_QUEUE_URL,
      },
    )
  }

  public getCookieCryptoParams(): CookieCryptoParams {
    return {
      cypherAlgorith: 'aes-256-ctr',
      ...this.validateConfig<CookieCryptoParams>(
        Joi.object({
          cookieSecret: Joi.string(),
          cookieIv: Joi.string(),
        }),
        {
          cookieSecret: process.env.COOKIE_KEY,
          cookieIv: process.env.COOKIE_IV,
        },
      ),
    }
  }

  public getJwtConfig(): JwtConfig {
    return {
      algorithm: 'HS256',
      ...this.validateConfig<{ secret: string }>(
        Joi.object({
          secret: Joi.string(),
        }),
        {
          secret: process.env.JWT_SECRET,
        },
      ),
    }
  }

  public getRedisConfig(): RedisConfig {
    return {
      ...this.validateConfig<{ host: string; port: number }>(
        Joi.object({
          host: Joi.string(),
          port: Joi.any(),
        }),
        {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
        },
      ),
    }
  }

  private validateConfig<T>(schema: Joi.ObjectSchema, config: Record<string, string | number | undefined>): T {
    const { error, value: validatedEnvConfig } = Joi.validate(config, schema)

    if (error) {
      throw new Error(`Config validation error: ${error.message}`)
    }

    return validatedEnvConfig
  }
}
