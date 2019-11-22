"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration_1 = require("../sequelize-setup/migration");
migration_1.runMigrations()
    .then(() => console.log('Job Done'))
    .then(() => process.exit(0));
//# sourceMappingURL=test_db_setup.js.map