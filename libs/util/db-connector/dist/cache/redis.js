"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const env_config_1 = tslib_1.__importDefault(require("../env-config"));
const api_redis_gateway_1 = require("./api-redis-gateway");
const redis_gateway_1 = require("./redis-gateway");
const redisDbConfig = env_config_1.default.redisDb;
let redisClient;
let cacheClient;
let cacheSubscriptionClient;
let apiCacheClient;
function getApiCacheClient() {
    if (!apiCacheClient) {
        const apiCacheConfig = Object.assign({}, redisDbConfig);
        apiCacheConfig.db = 1;
        apiCacheClient = new api_redis_gateway_1.APIRedisGateway(apiCacheConfig);
    }
    return apiCacheClient;
}
exports.getApiCacheClient = getApiCacheClient;
function closeApiCacheClient() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (apiCacheClient) {
            yield apiCacheClient.quit();
            apiCacheClient = undefined;
        }
    });
}
exports.closeApiCacheClient = closeApiCacheClient;
function getCacheClient() {
    if (!cacheClient) {
        cacheClient = new redis_gateway_1.RedisGateway(redisDbConfig);
    }
    return cacheClient;
}
exports.getCacheClient = getCacheClient;
function closeCacheClient() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (cacheClient) {
            yield cacheClient.quit();
            cacheClient = undefined;
        }
    });
}
exports.closeCacheClient = closeCacheClient;
function getCacheSubClient() {
    if (!cacheSubscriptionClient) {
        cacheSubscriptionClient = new redis_gateway_1.RedisGateway(redisDbConfig);
    }
    return cacheSubscriptionClient;
}
exports.getCacheSubClient = getCacheSubClient;
function closeSubClient() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (cacheSubscriptionClient) {
            yield cacheSubscriptionClient.quit();
            cacheSubscriptionClient = undefined;
        }
    });
}
exports.closeSubClient = closeSubClient;
function getVanillaRedisClient() {
    if (!redisClient) {
        redisClient = getCacheClient().redisClient;
    }
    return redisClient;
}
exports.getVanillaRedisClient = getVanillaRedisClient;
function closeVanillaRedisClient() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (redisClient) {
            yield redisClient.quit();
            redisClient = undefined;
        }
    });
}
exports.closeVanillaRedisClient = closeVanillaRedisClient;
//# sourceMappingURL=redis.js.map