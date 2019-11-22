"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const privateKey = 'test';
exports.default = {
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
        db: 0,
    },
    jwtSecret: privateKey,
};
//# sourceMappingURL=test.js.map