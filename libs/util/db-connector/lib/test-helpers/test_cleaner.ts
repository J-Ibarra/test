import sequelize from '../sequelize-setup'

// Keep this really simple. Only truncate transient tables (i.e. balances, orders etc)
// Lookup tables (currency, symbol and user will remain untouched)
export async function truncateTables(tablesToTruncate: string[] = []) {
  await sequelize.query(`TRUNCATE ${tablesToTruncate.map(table => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE;`)
  await sequelize.query('DROP SEQUENCE IF EXISTS abx_transactions_id_seq')
  await sequelize.query('CREATE SEQUENCE IF NOT EXISTS abx_transactions_id_seq')
}
