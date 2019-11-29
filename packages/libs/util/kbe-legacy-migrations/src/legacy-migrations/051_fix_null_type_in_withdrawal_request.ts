import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DO $$
      BEGIN
        IF EXISTS(SELECT *
          FROM information_schema.columns
          WHERE table_name='withdrawal_request' and column_name='state')
        THEN
          ALTER TABLE "public"."withdrawal_request" DROP COLUMN "state";
        END IF;

        IF EXISTS(SELECT *
          FROM information_schema.columns
          WHERE table_name='withdrawal_request' and column_name='type')
        THEN
          ALTER TABLE "public"."withdrawal_request" DROP COLUMN "type";
        END IF;

        IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'withdrawal_state')
        THEN
          CREATE TYPE withdrawal_state AS enum(
            'cancelled',
            'completed',
            'holdingsTransactionCompleted',
            'pending'
          );
        END IF;

        IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'withdrawal_request_type')
        THEN
          CREATE TYPE withdrawal_request_type AS enum(
            'withdrawal',
            'fee'
          );
        END IF;
        
        IF NOT EXISTS(SELECT *
          FROM information_schema.columns
          WHERE table_name='withdrawal_request' and column_name='type')
        THEN
          ALTER TABLE "public"."withdrawal_request" ADD COLUMN type withdrawal_request_type NOT NULL DEFAULT 'withdrawal';
        END IF;

        IF NOT EXISTS(SELECT *
          FROM information_schema.columns
          WHERE table_name='withdrawal_request' and column_name='state')
        THEN
          ALTER TABLE "public"."withdrawal_request" ADD COLUMN state withdrawal_state NOT NULL DEFAULT 'completed';
        END IF;
      END
    $$;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request
        DROP COLUMN type;
  `)
}
