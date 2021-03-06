export const dbConfig = {
  exchangeDb: {
    username: process.env.EXCHANGE_DB_USERNAME,
    password: process.env.EXCHANGE_DB_PASSWORD,
    schema: process.env.EXCHANGE_DB_NAME,
    dialect: 'postgres',
    host: process.env.EXCHANGE_DB_HOST,
    port: process.env.EXCHANGE_DB_PORT,
    pool: {
      max: process.env.DB_POOL_CONNECTIONS_MAX,
      min: process.env.DB_POOL_CONNECTIONS_MIN,
      idle: 10000,
      acquire: process.env.DB_POOL_CONNECTIONS_ACQUIRE || 40000,
    },
    readReplica: process.env.EXCHANGE_DB_READ_REPLICA_HOST
      ? {
          username: process.env.EXCHANGE_DB_USERNAME,
          password: process.env.EXCHANGE_DB_PASSWORD,
          database: process.env.EXCHANGE_DB_NAME,
          host: process.env.EXCHANGE_DB_READ_REPLICA_HOST,
          port: process.env.EXCHANGE_DB_PORT,
        }
      : undefined,
  },
  redisDb: {
    host: process.env.REDIS_DB_HOST,
    port: process.env.REDIS_DB_PORT,
    // Hard set to 0 as this should remain the default database
    // unless overridden during instantiation of a Redis client
    db: 0,
  },
  jwtSecret: process.env.JWT_SECRET,
}
