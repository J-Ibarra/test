import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
   ALTER TABLE public.deposit_request 
   ALTER COLUMN "holdingsTxFee" TYPE numeric;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TABLE public.deposit_request 
  ALTER COLUMN "holdingsTxFee" TYPE DECIMAL(20,8);
  `)
}
