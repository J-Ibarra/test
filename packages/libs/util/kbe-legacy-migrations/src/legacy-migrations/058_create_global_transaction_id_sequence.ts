import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    CREATE SEQUENCE public.global_transaction_id_seq START 145210001 cache 2;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DROP SEQUENCE public.global_transaction_id_seq;
  `)
}
