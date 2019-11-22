"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const lodash_1 = require("lodash");
const redis_1 = tslib_1.__importDefault(require("redis"));
bluebird_1.default.promisifyAll(redis_1.default.RedisClient.prototype);
class RedisGateway {
    constructor({ host, port, db }) {
        this.redisClient = redis_1.default.createClient({ host, port, db });
    }
    quit() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.redisClient.quit();
        });
    }
    set(key, value) {
        return this.redisClient.setAsync(key, JSON.stringify(value)).then(result => result === 'OK');
    }
    get(key) {
        return this.redisClient.getAsync(key).then(JSON.parse);
    }
    getAll(keys) {
        return this.redisClient.mgetAsync(...keys).then(values => values.map(value => JSON.parse(value)));
    }
    getList(key, limit = 0, offset = 0) {
        return this.redisClient.lrangeAsync(key, offset, limit - 1).then(entries => {
            if (lodash_1.isEmpty(entries)) {
                return [];
            }
            return !!entries.length ? entries.map(JSON.parse) : JSON.parse(entries);
        });
    }
    trimList(key, start, end) {
        return this.redisClient.ltrimAsync(key, start, end);
    }
    addValueToHeadOfList(key, value) {
        return this.redisClient.lpushAsync(key, JSON.stringify(value));
    }
    addValuesToHeadOfList(key, values) {
        const stringifiedValues = values.map(value => JSON.stringify(value)).reverse();
        return this.redisClient.lpushAsync(key, ...stringifiedValues);
    }
    addValueToTailOfList(key, ...values) {
        const stringifiedValues = values.map(value => JSON.stringify(value));
        return this.redisClient.rpushAsync(key, stringifiedValues);
    }
    getListLength(key) {
        return this.redisClient.llenAsync(key);
    }
    popLastElement(key) {
        return this.redisClient.rpopAsync(key).then(JSON.parse);
    }
    incrementHashField(key, field, increment) {
        return this.redisClient.hincrbyAsync(key, field, increment);
    }
    getAllHashValues(key) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.redisClient.hgetallAsync(key);
        });
    }
    setHashValue(key, field, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.redisClient.hsetAsync(key, field, `${value}`);
        });
    }
    flush() {
        return this.redisClient.flushallAsync();
    }
    publish(channel, message) {
        return this.redisClient.publishAsync(channel, JSON.stringify(message));
    }
}
exports.RedisGateway = RedisGateway;
//# sourceMappingURL=redis-gateway.js.map