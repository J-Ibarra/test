"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const umzug_1 = tslib_1.__importDefault(require("umzug"));
const sequelize_1 = tslib_1.__importDefault(require("sequelize"));
const _ = tslib_1.__importStar(require("lodash"));
const node_redis_warlock_1 = tslib_1.__importDefault(require("node-redis-warlock"));
const redis_1 = require("../cache/redis");
const index_1 = tslib_1.__importDefault(require("./index"));
const warlock = new node_redis_warlock_1.default(redis_1.getVanillaRedisClient());
function runMigrations() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log('Attempting to acquire lock to run migrations');
        return acquire_migration_lock(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log('Lock acquired, running migrations');
            const umzug = new umzug_1.default({
                storage: 'sequelize',
                storageOptions: {
                    sequelize: index_1.default,
                    model: index_1.default.models.sequelizeMeta,
                },
                logging: running => console.log(running),
                migrations: {
                    params: [index_1.default.getQueryInterface(), sequelize_1.default],
                    pattern: /\.js$/,
                    path: `${__dirname}/migrations/templates`,
                },
            });
            return umzug.up().then(() => {
                console.log('Migrations complete');
            });
        }));
    });
}
exports.runMigrations = runMigrations;
const migrationLock = 'migration-lock';
const ttl = 600000;
function acquire_migration_lock(handleUnlocked) {
    return new Promise((res, rej) => {
        warlock.lock(migrationLock, ttl, (err, unlock) => {
            if (err) {
                rej('Failed to acquire lock needed to run migrations.' + err.message);
            }
            else if (_.isFunction(unlock)) {
                return handleUnlocked().then(() => {
                    unlock();
                    return res();
                }, error => {
                    rej('Failed to run migrations.' + error.message);
                });
            }
            else {
                setTimeout(() => {
                    acquire_migration_lock(handleUnlocked).then(res, rej);
                }, 1000);
            }
        });
    });
}
function migrationModel(sequelize) {
    const options = {
        tableName: 'sequelize_meta',
        timestamps: false,
    };
    return sequelize.define('sequelizeMeta', {
        name: {
            type: sequelize_1.default.STRING,
            primaryKey: true,
        },
    }, options);
}
exports.migrationModel = migrationModel;
//# sourceMappingURL=migration.js.map