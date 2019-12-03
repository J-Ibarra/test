import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(
    `
    ALTER TABLE public.user ADD COLUMN "referredBy" UUID REFERENCES public.account(id);
  `,
  )
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TABLE public.user DROP COLUMN "referredBy";

  `)
}
