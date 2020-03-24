export const dbConfig = {
  exchangeDb: {
    username: process.env.EXCHANGE_DB_USERNAME || 'postgres',
    password: process.env.EXCHANGE_DB_PASSWORD || 'postgres',
    schema: process.env.EXCHANGE_DB_NAME || 'kinesis_exchange',
    dialect: 'postgres',
    host: process.env.EXCHANGE_DB_HOST || 'postgres',
    port: process.env.EXCHANGE_DB_PORT || 6432,
    pool: {
      max: 100,
      min: 5,
      idle: 20000,
      acquire: 120000,
    },
  },
  redisDb: {
    host: process.env.REDIS_DB_HOST || 'redis',
    port: process.env.REDIS_DB_PORT || 7379,
    // Hard set to 0 as this should remain the default database
    // unless overridden during instantiation of a Redis client
    db: 0,
  },
  jwtSecret: 'foo',
}
