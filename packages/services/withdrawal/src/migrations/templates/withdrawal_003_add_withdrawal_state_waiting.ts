import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request ALTER state DROP DEFAULT;
    ALTER TABLE public.withdrawal_request ALTER COLUMN state TYPE character varying(255);

    DROP TYPE IF EXISTS withdrawal_state_v2;

    CREATE TYPE withdrawal_state_v2 AS enum(
      'cancelled',
      'completed',
      'holdingsTransactionCompleted',
      'pending',
      'waiting'
    );

    ALTER TABLE public.withdrawal_request ALTER COLUMN state TYPE withdrawal_state_v2 USING ('completed'::withdrawal_state_v2);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TABLE public.withdrawal_request ALTER state DROP DEFAULT;
  ALTER TABLE public.withdrawal_request ALTER COLUMN state TYPE character varying(255);

  DROP TYPE IF EXISTS withdrawal_state_v2;

  CREATE TYPE withdrawal_state_v2 AS enum(
    'cancelled',
    'completed',
    'holdingsTransactionCompleted',
    'pending',
  );

  ALTER TABLE public.withdrawal_request ALTER COLUMN state TYPE withdrawal_state_v2 USING ('completed'::withdrawal_state_v2);
  `)
}
