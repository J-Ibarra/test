"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_connection_utils_1 = require("@abx/db-connection-utils");
function createNote(title, description) {
    return db_connection_utils_1.getModel('depositRequest').create({
        title,
        description,
    });
}
exports.createNote = createNote;
//# sourceMappingURL=note_creation_handler.js.map