import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query('UPDATE public.default_execution_fee SET "rate"=0.0022')
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query('')
}
