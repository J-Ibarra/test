import { Sequelize } from 'sequelize'
import { DepositRequestStatus } from '../../deposits/interfaces'

// Setting the state to complete here after the withdrawal_state update
// This will be safe for production as we don't have data there
export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`

   ALTER TYPE deposit_request_state ADD VALUE '${DepositRequestStatus.suspended}' AFTER '${DepositRequestStatus.completed}';

  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  DROP TYPE deposit_request_state;
  CREATE TYPE deposit_request_state AS enum(
  '${DepositRequestStatus.pendingHoldingsTransaction}',
  '${DepositRequestStatus.failedHoldingsTransaction}',
  '${DepositRequestStatus.pendingCompletion}',
  '${DepositRequestStatus.completed}'
  );
  `)
}
