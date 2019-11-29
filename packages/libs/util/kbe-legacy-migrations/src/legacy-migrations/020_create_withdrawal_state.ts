import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`CREATE TYPE withdrawal_state AS ENUM(:withdrawalStates);`, {
    replacements: {
      withdrawalStates: ['cancelled', 'completed', 'holdingsTransactionCompleted', 'pending'],
    },
  })
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DROP TYPE withdrawal_state;`)
}
