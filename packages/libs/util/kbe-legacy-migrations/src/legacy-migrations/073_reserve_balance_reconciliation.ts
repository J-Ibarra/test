import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('reconcileReserveBalances', 'UTC', '0 0 * * 0', true, now(), now())
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE cron_schedule where name in ('reconcileReserveBalances');
  `)
}
