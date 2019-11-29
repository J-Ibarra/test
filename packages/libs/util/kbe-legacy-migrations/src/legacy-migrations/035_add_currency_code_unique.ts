import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE ONLY public.currency
    ADD CONSTRAINT code_key UNIQUE (code);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.currency
    DROP CONSTRAINT code_key;
  `)
}
