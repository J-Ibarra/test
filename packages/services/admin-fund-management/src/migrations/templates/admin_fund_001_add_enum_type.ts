import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    ALTER TYPE admin_request_type ADD VALUE 'mint' AFTER 'withdrawal';
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DROP TYPE admin_request_type;
    CREATE TYPE admin_request_type AS enum(
    'deposit',
    'redemption',
    'withdrawal'
    );
    `)
}
