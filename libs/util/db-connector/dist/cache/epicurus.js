"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const env_config_1 = tslib_1.__importDefault(require("../env-config"));
const dbConfig = env_config_1.default.redisDb;
const epicurus_node_1 = tslib_1.__importDefault(require("epicurus-node"));
let epicurus;
function getInstance() {
    if (epicurus) {
        return epicurus;
    }
    epicurus = epicurus_node_1.default({
        host: dbConfig.host,
        port: dbConfig.port,
    });
    return epicurus;
}
exports.getInstance = getInstance;
function closeInstance() {
    if (epicurus) {
        epicurus.close();
        epicurus = null;
    }
}
exports.closeInstance = closeInstance;
//# sourceMappingURL=epicurus.js.map