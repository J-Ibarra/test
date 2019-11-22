"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbConfig = {
    exchangeDb: {
        username: process.env.EXCHANGE_DB_USERNAME || 'postgres',
        password: process.env.EXCHANGE_DB_PASSWORD || 'postgres',
        schema: process.env.EXCHANGE_DB_NAME || 'kinesis_exchange',
        dialect: 'postgres',
        host: process.env.EXCHANGE_DB_HOST || 'postgres',
        port: process.env.EXCHANGE_DB_PORT || 5432,
        pool: {
            max: 20,
            min: 5,
            idle: 20000,
            acquire: 20000,
        },
    },
    redisDb: {
        host: process.env.REDIS_DB_HOST || 'redis',
        port: process.env.REDIS_DB_PORT || 6379,
        db: 0,
    },
    jwtSecret: 'foo',
};
exports.default = dbConfig;
//# sourceMappingURL=local.js.map