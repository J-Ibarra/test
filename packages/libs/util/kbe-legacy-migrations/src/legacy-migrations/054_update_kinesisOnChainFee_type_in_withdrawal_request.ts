import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
   ALTER TABLE public.withdrawal_request 
   ALTER COLUMN "kinesisCoveredOnChainFee" TYPE numeric;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TABLE public.withdrawal_request 
  ALTER COLUMN "kinesisCoveredOnChainFee" TYPE DECIMAL(20,8);
  `)
}
