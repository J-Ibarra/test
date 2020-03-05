import { Sequelize } from 'sequelize'
import { DepositRequestStatus } from '@abx-types/deposit'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TYPE deposit_request_state ADD VALUE '${DepositRequestStatus.pendingDepositTransactionConfirmation}';
  ALTER TYPE deposit_request_state ADD VALUE '${DepositRequestStatus.pendingHoldingsTransactionConfirmation}';
    `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query('')
}
