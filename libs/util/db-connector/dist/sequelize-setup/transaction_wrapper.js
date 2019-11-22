"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const logging_1 = require("@abx/logging");
const logger = logging_1.Logger.getInstance('transaction_wrapper', 'wrapInTransaction');
function wrapInTransaction(sequelize, transaction, fn, errorCallback, isolationLevel = sequelize_1.Transaction.ISOLATION_LEVELS.READ_COMMITTED, deferrable = sequelize_1.Deferrable.SET_IMMEDIATE, autoCommit = true) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const transactionConfig = {
            isolationLevel,
            deferrable,
            autoCommit,
        };
        return transaction
            ? fn(transaction).catch(e => transactionErrorCatcher(e, errorCallback, transaction))
            : sequelize.transaction(transactionConfig, fn).catch(e => transactionErrorCatcher(e, errorCallback));
    });
}
exports.wrapInTransaction = wrapInTransaction;
function transactionErrorCatcher(err, errorCallback, transaction) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (transaction && !err.message.includes('rollback has been called on this transaction')) {
            yield transaction.rollback().catch(e => {
                logger.warn(`Rollback can't be completed: err msg : ${e.message},`);
            });
        }
        if (err.message.includes('deadlock detected')) {
            logger.debug(`Deadlock Detected - Restarting Operation`);
            if (errorCallback) {
                return errorCallback();
            }
            else {
                logger.error(`Error with transaction wrapper,no callback - stack: ${err.stack}, message: ${err.message}`);
                throw err;
            }
        }
        else {
            logger.error(`Error with transaction wrapper - stack: ${err.stack}, message: ${err.message}`);
            throw err;
        }
    });
}
//# sourceMappingURL=transaction_wrapper.js.map