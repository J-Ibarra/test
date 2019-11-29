import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    INSERT INTO public.balance_type ("type", "createdAt", "updatedAt") VALUES (5, now(), now())
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DELETE FROM balance_type where type = 5;`)
}
