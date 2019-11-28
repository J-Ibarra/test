import { DepositRequestStatus } from '../../deposits/interfaces'

export function up(queryInterface) {
  return queryInterface.sequelize.query(
    `
    DO $$
      BEGIN
        IF EXISTS(SELECT *
          FROM information_schema.columns
          WHERE table_name='deposit_request' and column_name='txHash')
        THEN
          ALTER TABLE "public"."deposit_request" RENAME COLUMN "txHash" TO "depositTxHash";
        END IF;

        IF NOT EXISTS(SELECT *
          FROM information_schema.columns
          WHERE table_name='deposit_request' and column_name='holdingsTxHash')
        THEN
          ALTER TABLE "public"."deposit_request" ADD COLUMN "holdingsTxHash" character varying(255);
        END IF;

        IF EXISTS(SELECT *
          FROM information_schema.columns
          WHERE table_name='deposit_request' and column_name='isConfirmed')
        THEN
          ALTER TABLE "public"."deposit_request" DROP COLUMN "isConfirmed";
        END IF;

        IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'deposit_request_state')
        THEN
          CREATE TYPE deposit_request_state AS enum(
            '${DepositRequestStatus.pendingHoldingsTransaction}',
            '${DepositRequestStatus.failedHoldingsTransaction}',
            '${DepositRequestStatus.pendingCompletion}',
            '${DepositRequestStatus.completed}'
          );
        END IF;

        IF NOT EXISTS(SELECT *
          FROM information_schema.columns
          WHERE table_name='deposit_request' and column_name='status')
        THEN
          ALTER TABLE "public"."deposit_request" ADD COLUMN status deposit_request_state NOT NULL DEFAULT '${DepositRequestStatus.completed}';
        END IF;
      END
    $$;
  `,
    { raw: true },
  )
}

export function down(queryInterface) {
  queryInterface.sequelize.query(
    `
    ALTER TABLE deposit_request DROP COLUMN status;
    ALTER TABLE deposit_request RENAME COLUMN "depositTxHash" TO "txHash";
    ALTER TABLE deposit_request DROP COLUMN "holdingsTxHash";
    ALTER TABLE deposit_request ADD COLUMN "isConfirmed" boolean DEFAULT false NOT NULL;

    DROP TYPE deposit_request_state;
  `,
    { raw: true },
  )
}
