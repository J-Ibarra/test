import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
  INSERT INTO currency(currency, "createdAt", "updatedAt")
  values ('ETH', now(), now());

  INSERT INTO currency(currency,  "createdAt", "updatedAt")
  values ('KAU', now(), now());

  INSERT INTO currency(currency,  "createdAt", "updatedAt")
  values ('KAG', now(), now());

  INSERT INTO currency(currency,  "createdAt", "updatedAt")
  values ('KVT', now(), now());

  INSERT INTO currency(currency,  "createdAt", "updatedAt")
  values ('USD', now(), now());

  INSERT INTO currency(currency,  "createdAt", "updatedAt")
  values ('EUR', now(), now());
  `)
}

export function down(queryInterface) {
  return queryInterface.sequelize.query('DELETE FROM currency')
}
