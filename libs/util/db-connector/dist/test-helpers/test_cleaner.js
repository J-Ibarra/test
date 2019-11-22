"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sequelize_setup_1 = tslib_1.__importDefault(require("../sequelize-setup"));
function truncateTables(tablesToTruncate = []) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield sequelize_setup_1.default.query(`TRUNCATE ${tablesToTruncate.map(table => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE;`);
        yield sequelize_setup_1.default.query('DROP SEQUENCE IF EXISTS abx_transactions_id_seq');
        yield sequelize_setup_1.default.query('CREATE SEQUENCE IF NOT EXISTS abx_transactions_id_seq');
    });
}
exports.truncateTables = truncateTables;
//# sourceMappingURL=test_cleaner.js.map