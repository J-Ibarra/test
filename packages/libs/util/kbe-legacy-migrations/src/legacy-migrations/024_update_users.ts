import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    ALTER TABLE public.user
    ADD COLUMN "firstName" TEXT,
    ADD COLUMN "lastName" TEXT,
    ADD COLUMN "qrcodeUrl" TEXT;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.user
    DROP COLUMN IF EXISTS "firstName",
    DROP COLUMN IF EXISTS "lastName",
    DROP COLUMN IF EXISTS "qrcodeUrl";
  `)
}
