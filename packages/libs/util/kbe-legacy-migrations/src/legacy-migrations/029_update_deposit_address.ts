import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    ALTER TABLE public.deposit_address
      RENAME COLUMN "privateKey" TO "encryptedPrivateKey";

    ALTER TABLE public.deposit_address
      ALTER COLUMN "encryptedPrivateKey" TYPE character varying(1000);

    ALTER TABLE public.deposit_address
      ADD COLUMN "publicKey" character varying(255) NOT NULL;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.deposit_address
      ALTER COLUMN "encryptedPrivateKey" TYPE character varying(255);

    ALTER TABLE public.deposit_address
      RENAME COLUMN "encryptedPrivateKey" TO "privateKey";

    ALTER TABLE public.deposit_address
      DROP COLUMN IF EXISTS "publicKey";
  `)
}
