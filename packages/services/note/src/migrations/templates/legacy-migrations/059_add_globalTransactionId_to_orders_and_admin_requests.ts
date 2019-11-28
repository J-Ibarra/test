import { Sequelize } from 'sequelize'
import { GTIDInitials } from '../../admin-fund-management/models/global_transaction_id'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public."order"
      ADD COLUMN "globalTransactionId" character varying(20) UNIQUE NOT NULL DEFAULT ('${GTIDInitials.order}' || nextval('global_transaction_id_seq'));

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
