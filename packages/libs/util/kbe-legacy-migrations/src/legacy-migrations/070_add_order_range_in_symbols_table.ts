import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.symbol
      ADD COLUMN "orderRange" numeric (20,8)
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.symbol
      DROP COLUMN "orderRange";
  `)
}
