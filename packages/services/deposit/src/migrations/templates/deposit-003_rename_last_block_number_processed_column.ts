import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(
    `
    ALTER TABLE public.blockchain_follower_details RENAME COLUMN "lastBlockNumberProcessed" to "lastEntityProcessedIdentifier";

    ALTER TABLE public.blockchain_follower_details
      ALTER COLUMN "lastBlockNumberProcessed" TYPE character varying(200);`,
  )
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(
    `
    ALTER TABLE public.blockchain_follower_details RENAME COLUMN "lastEntityProcessedIdentifier" to "lastBlockNumberProcessed";

    ALTER TABLE public.blockchain_follower_details
      ALTER COLUMN "lastBlockNumberProcessed" TYPE numeric;`,
  )
}
