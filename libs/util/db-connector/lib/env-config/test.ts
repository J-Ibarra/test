const privateKey = 'test'

export default {
  exchangeDb: {
    username: 'postgres',
    password: '',
    schema: 'kinesis_exchange',
    dialect: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    pool: {
      max: 100,
      min: 0,
      idle: 1000,
      acquire: 20000,
    },
  },
  redisDb: {
    host: process.env.REDIS_DB_HOST || 'redis',
    port: process.env.REDIS_DB_PORT || 6379,
    // Hard set to 0 as this should remain the default database
    // unless overridden during instantiation of a Redis client
    db: 0,
  },
  jwtSecret: privateKey,
}
