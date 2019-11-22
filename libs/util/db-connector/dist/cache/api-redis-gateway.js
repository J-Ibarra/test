"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const moment_1 = tslib_1.__importDefault(require("moment"));
const redis_1 = tslib_1.__importDefault(require("redis"));
const logging_1 = require("@abx/logging");
const redis_gateway_1 = require("./redis-gateway");
bluebird_1.default.promisifyAll(redis_1.default.RedisClient.prototype);
const logger = logging_1.Logger.getInstance('api', 'response-cache');
class APIRedisGateway extends redis_gateway_1.RedisGateway {
    constructor() {
        super(...arguments);
        this.keyPrefix = 'api-cache-';
    }
    setCache(key, value, ttl = 300) {
        const cacheKey = this.getKey(key);
        const storedValue = {
            value,
            expiresAt: moment_1.default()
                .add('seconds', ttl)
                .toDate()
                .getTime(),
        };
        logger.info(`Setting cache entry ${cacheKey}`);
        return this.set(cacheKey, storedValue);
    }
    getCache(key) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const cacheKey = this.getKey(key);
            logger.info(`Getting cache entry ${cacheKey}`);
            const response = yield this.get(cacheKey);
            const currentTime = new Date().getTime();
            if (!response || currentTime >= response.expiresAt) {
                logger.info(`Cache entry for ${cacheKey} either does not exist or is expired`);
                return null;
            }
            logger.info(`Successfully fetched cache entry ${cacheKey}`);
            return response.value;
        });
    }
    getKey(key) {
        return `${this.keyPrefix}${key}`;
    }
}
exports.APIRedisGateway = APIRedisGateway;
//# sourceMappingURL=api-redis-gateway.js.map