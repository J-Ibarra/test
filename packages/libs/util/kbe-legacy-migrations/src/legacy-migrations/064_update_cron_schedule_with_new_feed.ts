import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    UPDATE public.cron_schedule SET cron='* * * * *' WHERE name='accountKycCheck';
    `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    UPDATE public.cron_schedule SET cron='*/5 * * * * *' WHERE name='accountKycCheck';
    `)
}
