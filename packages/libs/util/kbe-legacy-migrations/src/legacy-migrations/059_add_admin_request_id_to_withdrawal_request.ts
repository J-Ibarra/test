import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    ALTER TABLE public.withdrawal_request
      ADD COLUMN "adminRequestId" integer;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request
      DROP COLUMN IF EXISTS "adminRequestId";
  `)
}
