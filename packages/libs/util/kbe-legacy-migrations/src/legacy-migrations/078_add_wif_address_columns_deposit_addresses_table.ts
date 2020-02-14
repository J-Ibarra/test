import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.deposit_address
      ADD COLUMN "address" character varying(255),
      ADD COLUMN "encryptedWif" character varying(255);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.deposit_address
        DROP COLUMN "address",
        DROP COLUMN "encryptedWif";
  `)
}
