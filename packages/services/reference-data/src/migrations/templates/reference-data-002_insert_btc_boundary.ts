import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  INSERT INTO public.boundary("currencyId", "currencyCode", "minAmount", "maxDecimals", "createdAt", "updatedAt")
  values (8, 'BTC', 0.00000005, 8, now(), now());
    `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM public.boundary WHERE "currencyCode"='BTC';
    `)
}
