/** Defines the Redis connectivity properties. */
export interface RedisConfig {
  /** The redis host.  */
  host: string
  /** The open port that redis is listening on. */
  port: number
  db: number
}

/** All the details required to set up a Postgres connection pool. */
export interface DbConfig {
  username: string
  password: string
  schema: string
  dialect: string
  host: string
  port: number
  pool: {
    max: number
    min: number
    idle: number
  }
  readReplica?: {
    username: string
    password: string
    database: string
    host: string
    port: number
  }
}

export interface EnvironmentConfig {
  exchangeDb: DbConfig
  redisDb: RedisConfig
  jwtSecret: string
}
