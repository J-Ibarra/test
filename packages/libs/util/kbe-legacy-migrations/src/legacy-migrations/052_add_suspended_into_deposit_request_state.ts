import { Sequelize } from 'sequelize'

// Setting the state to complete here after the withdrawal_state update
// This will be safe for production as we don't have data there
export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`

   ALTER TYPE deposit_request_state ADD VALUE 'suspended' AFTER 'completed';

  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  DROP TYPE deposit_request_state;
  CREATE TYPE deposit_request_state AS enum(
  'pendingHoldingsTransaction',
  'failedHoldingsTransaction',
  'pendingCompletion',
  'completed'
  );
  `)
}
