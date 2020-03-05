import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request
      ADD COLUMN "feeWithdrawalRequestId" integer REFERENCES public.withdrawal_request(id);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request
        DROP COLUMN "feeWithdrawalRequestId";
  `)
}
