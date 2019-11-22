"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@abx/note-query-lib");
const db_connection_utils_1 = require("@abx/db-connection-utils");
db_connection_utils_1.runMigrations().then(() => console.log('Note migrations successfully executed'));
//# sourceMappingURL=index.js.map