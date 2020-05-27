import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    UPDATE public.boundary SET
    "maxDecimals" = 6
    WHERE "currencyCode" = 'USDT';

    UPDATE public.boundary SET
    "currencyId" = 7
    WHERE "currencyCode" = 'GBP';
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    UPDATE public.boundary SET
    "maxDecimals" = 2
    WHERE "currencyCode" = 'USDT';

    UPDATE public.boundary SET
    "currencyId" = 1
    WHERE "currencyCode" = 'GBP';
  `)
}
