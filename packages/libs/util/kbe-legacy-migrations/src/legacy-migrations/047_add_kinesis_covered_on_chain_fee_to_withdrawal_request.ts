import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(
    `
    ALTER TABLE public.withdrawal_request ADD COLUMN "kinesisCoveredOnChainFee" decimal(20,8) DEFAULT 0;
  `,
  )
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request DROP COLUMN "kinesisCoveredOnChainFee";
  `)
}
