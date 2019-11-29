import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`CREATE TYPE transaction_direction AS enum('Deposit', 'Withdrawal');`)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DROP TYPE transaction_direction;`)
}
