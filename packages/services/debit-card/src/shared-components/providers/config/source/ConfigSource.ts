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

export const CONFIG_SOURCE_TOKEN = 'CONFIG_SOURCE'

/** A mechanism for providing environment-specific configuration properties. */
export interface ConfigSource {
  /** Retrieves the Exchange {@link DbConfig} based on the current environment. */
  getExchangeDbConfig(): DbConfig

  /** Retrieves the Debit-card {@link DbConfig} based on the current environment. */
  getDebitCardDbConfig(): DbConfig

  /** Retrieves the URL where the user interface is running. */
  getUserInterfaceDomain(): string

  /** Retrieves the log level defined on startup. */
  getLogLevel(): LogLevel

  /**
   * The login details are different based on the currency schema.
   *
   * @param currency the currency to retrieve the config for,
   */
  getContisLogin(currency: CurrencyCode): ContisLogin

  /**
   * Retrieves the environment-specific Contis integration details.
   */
  getContisConfig(): ContisConfiguration

  /** Retrieves the details required for producing and decrypting cookie hashes. */
  getCookieCryptoParams(): CookieCryptoParams

  /** Retrieves the details required for validating JWT tokens. */
  getJwtConfig(): JwtConfig

  /** Retrieves the details required to set-up Redis connectivity. */
  getRedisConfig(): RedisConfig
}
