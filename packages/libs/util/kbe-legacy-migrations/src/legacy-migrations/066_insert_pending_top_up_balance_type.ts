import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  INSERT INTO public.balance_type("type", "createdAt", "updatedAt")
  values (6, now(), now());
    `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM public.balance_type WHERE "id"=6;
    `)
}
