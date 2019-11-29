import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  INSERT INTO balance_type(type, "createdAt", "updatedAt")
  values (1, now(), now());

  INSERT INTO balance_type(type, "createdAt", "updatedAt")
  values (2, now(), now());

  INSERT INTO balance_type(type, "createdAt", "updatedAt")
  values (4, now(), now());


  INSERT INTO balance_type(type, "createdAt", "updatedAt")
  values (3, now(), now());
  `)
}

export function down(queryInterface) {
  return queryInterface.sequelize.query(`DELETE FROM public.balance_type where id > 0;`)
}
