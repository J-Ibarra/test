import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public."order"
      ADD COLUMN "globalTransactionId" character varying(20) UNIQUE NOT NULL DEFAULT ('OT' || nextval('global_transaction_id_seq'));

    ALTER TABLE public.admin_request
      ADD COLUMN "globalTransactionId" character varying(20) UNIQUE NOT NULL DEFAULT ('AT' || nextval('global_transaction_id_seq'));
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public."order"
      DROP COLUMN "globalTransactionId";

    ALTER TABLE public.admin_request
      DROP COLUMN "globalTransactionId";
  `)
}
