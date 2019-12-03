import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.trade_transaction
      ADD COLUMN "baseFiatConversion" decimal(20,8),
      ADD COLUMN "quoteFiatConversion" decimal(20,8),
      ADD COLUMN "fiatCurrencyCode" character varying(3) REFERENCES public.currency(code);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.trade_transaction
      DROP COLUMN "baseFiatConversion",
      DROP COLUMN "quoteFiatConversion",
      DROP COLUMN "fiatCurrencyCode";
  `)
}
