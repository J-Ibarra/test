import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(
    `
    ALTER TABLE public.admin_request ALTER COLUMN "description" DROP NOT NULL;
  `,
  )
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TABLE public.admin_request ALTER COLUMN "description" SET NOT NULL;
  `)
}
