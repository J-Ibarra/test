"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function up(queryInterface) {
    return queryInterface.sequelize.query(`
      CREATE TABLE public.note (
          id uuid NOT NULL,
          "title" character varying(255) NOT NULL,
          "description" character varying(255) NOT NULL
      );

      ALTER TABLE public.note OWNER TO postgres;
    `);
}
exports.up = up;
function down(queryInterface) {
    return queryInterface.sequelize.query(`DROP TABLE public.note;`);
}
exports.down = down;
//# sourceMappingURL=01-notes-create-table.js.map