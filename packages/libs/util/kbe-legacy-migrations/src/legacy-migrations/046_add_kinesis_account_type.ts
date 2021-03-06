import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(
    `
    ALTER TYPE account_role ADD VALUE 'kinesisRevenue';
  `,
  )
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.account ALTER COLUMN type TYPE character varying(255);

    DROP TYPE account_role;
    CREATE TYPE account_role AS enum(
      'administrator', 'corporate', 'individual', 'operator'
    );

    ALTER TABLE public.account ALTER COLUMN type TYPE account_role USING (type::account_role);
  `)
}
