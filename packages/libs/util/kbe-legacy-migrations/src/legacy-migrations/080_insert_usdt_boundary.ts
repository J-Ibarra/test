import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`

      ALTER TABLE public.boundary ALTER COLUMN "currencyCode" TYPE varchar(4);

      INSERT INTO public.boundary("currencyId", "currencyCode", "minAmount", "maxDecimals", "createdAt", "updatedAt")
        values (9, 'USDT', 0.000001, 6, now(), now());

  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM public.boundary WHERE "currencyCode"='USDT';
  `)
}
