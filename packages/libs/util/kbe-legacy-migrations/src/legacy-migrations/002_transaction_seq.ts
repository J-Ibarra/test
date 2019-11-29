export function up(queryInterface) {
  return queryInterface.sequelize.query('CREATE SEQUENCE IF NOT EXISTS abx_transactions_id_seq')
}

export function down(queryInterface) {
  return queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS abx_transactions_id_seq')
}
