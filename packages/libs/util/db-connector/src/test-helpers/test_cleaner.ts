import { sequelize } from '../sequelize-setup'

const TRANSIENT_TABLES = [
  'bank_details',
  'session',
  'balance_adjustment',
  'balance',
  'trade_transaction',
  'deposit_address',
  'stored_reports',
  'deposit_request',
  'account_execution_fee',
  'default_execution_fee',
  'monthly_trade_accumulation',
  'exchange_events',
  'email_attachment',
  'email',
  'withdrawal_request',
  'ohlc_market_data',
  'depth_mid_price',
  'token',
  'vault_address',
  'order_match_transaction',
  'currency_transaction',
  'admin_request',
  'salesforce',
  'order',
  'order_event',
  'user',
  'account',
]

// Keep this really simple. Only truncate transient tables (i.e. balances, orders etc)
// Lookup tables (currency, symbol and user will remain untouched)
export async function truncateTables(additionalTablesToTruncate: string[] = []) {
  // await sequelize.query(
  //   `TRUNCATE ${TRANSIENT_TABLES.concat(additionalTablesToTruncate)
  //     .map(table => `"${table}"`)
  //     .join(', ')} RESTART IDENTITY CASCADE;`,
  // )
  await sequelize.query(
    TRANSIENT_TABLES.concat(additionalTablesToTruncate)
      .map(table => `DELETE FROM "${table}"`)
      .join(';'),
  )
  await sequelize.query('DROP SEQUENCE IF EXISTS abx_transactions_id_seq')
  await sequelize.query('CREATE SEQUENCE IF NOT EXISTS abx_transactions_id_seq')
}
