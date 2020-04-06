import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TABLE public.deposit_request ALTER status DROP DEFAULT;
  ALTER TABLE public.deposit_request ALTER COLUMN status TYPE character varying(255);

  DROP TYPE IF EXISTS deposit_request_state_v2;

  CREATE TYPE deposit_request_state_v2 AS enum(
    'pendingHoldingsTransaction',
    'failedHoldingsTransaction',
    'pendingCompletion',
    'completed',
    'suspended',
    'pendingDepositTransactionConfirmation',
    'insufficientAmount'
  );

  ALTER TABLE public.deposit_request ALTER COLUMN status TYPE deposit_request_state_v2 USING ('completed'::deposit_request_state_v2);
    `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TABLE public.deposit_request ALTER status DROP DEFAULT;
  ALTER TABLE public.deposit_request ALTER COLUMN status TYPE character varying(255);

  CREATE TYPE deposit_request_state_v3 AS enum(
    'pendingHoldingsTransaction',
    'failedHoldingsTransaction',
    'pendingCompletion',
    'suspended',
    'completed'
  );

  ALTER TABLE public.deposit_request ALTER COLUMN status TYPE deposit_request_state_v3 USING ('completed'::deposit_request_state_v2);

  `)
}
