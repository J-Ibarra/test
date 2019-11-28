import { Sequelize } from 'sequelize'
import { WithdrawalState } from '../../withdrawals/interfaces'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`CREATE TYPE withdrawal_state AS ENUM(:withdrawalStates);`, {
    replacements: {
      withdrawalStates: Object.keys(WithdrawalState)
    }
  })
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DROP TYPE withdrawal_state;`)
}
