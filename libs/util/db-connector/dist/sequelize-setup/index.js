"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sequelize_1 = tslib_1.__importDefault(require("sequelize"));
const env_config_1 = tslib_1.__importDefault(require("../env-config"));
const dbConfig = env_config_1.default.exchangeDb;
const sequelize = new sequelize_1.default(dbConfig.schema, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    port: dbConfig.port,
    pool: dbConfig.pool,
    logging: false,
    define: {
        freezeTableName: true,
    },
});
sequelize
    .authenticate()
    .then(() => {
    console.log('Connection has been established successfully.');
})
    .catch(err => {
    console.error('Unable to connect to the database:', err);
});
exports.exitOnLostConnection = (sequelizeInstance) => {
    setInterval(() => {
        sequelizeInstance.query('select 1;').catch((error) => {
            console.error('DB Connection issue detected.');
            console.error('error:', error);
            console.error('sequelizeInstance:', sequelizeInstance);
            console.error('Calling `process.exit()`.');
            process.exit();
        });
    }, 30 * 1000);
};
exports.exitOnLostConnection(sequelize);
if (process.env.SYNCDB) {
    sequelize.sync().catch(error => {
        console.error(JSON.stringify(error, null, 2));
        throw error;
    });
}
exports.default = sequelize;
tslib_1.__exportStar(require("./transaction_wrapper"), exports);
tslib_1.__exportStar(require("./migration"), exports);
function setupModel(modelSetupFn) {
    modelSetupFn(sequelize);
}
exports.setupModel = setupModel;
function getModel(modelName) {
    return sequelize.model(modelName);
}
exports.getModel = getModel;
//# sourceMappingURL=index.js.map