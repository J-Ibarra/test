import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.symbol
      ADD COLUMN "isEnabled" BOOLEAN DEFAULT true;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.symbol
      DROP COLUMN "isEnabled";
  `)
}
