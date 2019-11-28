import { Sequelize } from 'sequelize'
import { AccountType } from '../../accounts'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(
    `
    CREATE TYPE account_role AS enum(
      '${AccountType.admin}', '${AccountType.corporate}', '${AccountType.individual}', '${AccountType.operator}'
    );

    ALTER TABLE public.account ALTER COLUMN type TYPE account_role USING (type::account_role);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DROP TYPE account_role`)
}
