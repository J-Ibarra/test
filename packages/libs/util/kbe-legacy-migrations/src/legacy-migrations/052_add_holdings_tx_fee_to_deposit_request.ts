import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    ALTER TABLE public.deposit_request
      ADD COLUMN "holdingsTxFee" DECIMAL(20,8);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.deposit_request
      DROP COLUMN IF EXISTS "holdingsTxFee";
  `)
}
