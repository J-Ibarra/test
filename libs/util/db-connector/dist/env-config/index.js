"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const local_1 = tslib_1.__importDefault(require("./local"));
const production_1 = tslib_1.__importDefault(require("./production"));
const test_1 = tslib_1.__importDefault(require("./test"));
const cloudEnvironments = ['production', 'uat', 'integration', 'test-automation'];
let environmentConfig;
if (process.env.NODE_ENV === 'test') {
    environmentConfig = test_1.default;
}
else if (cloudEnvironments.includes(process.env.NODE_ENV)) {
    environmentConfig = production_1.default;
}
else {
    environmentConfig = local_1.default;
}
exports.default = environmentConfig;
//# sourceMappingURL=index.js.map