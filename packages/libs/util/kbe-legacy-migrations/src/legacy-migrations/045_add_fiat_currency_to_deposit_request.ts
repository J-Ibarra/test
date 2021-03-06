import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.deposit_request
      ADD COLUMN "fiatConversion" decimal(30, 20),
      ADD COLUMN "fiatCurrencyCode" character varying(3) REFERENCES public.currency(code);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request
      DROP COLUMN "fiatConversion",
      DROP COLUMN "fiatCurrencyCode";
  `)
}
