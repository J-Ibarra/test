import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    ALTER TABLE public.admin_request
      ADD COLUMN "tradingPlatformName" character varying(255);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.admin_request
      DROP COLUMN IF EXISTS "tradingPlatformName";
  `)
}
