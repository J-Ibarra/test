import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  INSERT INTO public.boundary("currencyId", "currencyCode", "minAmount", "maxDecimals", "createdAt", "updatedAt")
  values (1, 'GBP', 0.01, 2, now(), now());
    `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM public.boundary WHERE "currencyCode"='GBP';
    `)
}
