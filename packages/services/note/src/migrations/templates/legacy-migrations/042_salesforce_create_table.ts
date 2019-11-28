import { QueryInterface } from 'sequelize'
import { getModel } from '../abx_modules'

export async function up(queryInterface: QueryInterface) {
  const salesforceModel = getModel('salesforce')
  await salesforceModel.sync()
  return queryInterface.sequelize.query(
    `

  ALTER TABLE public.account ADD COLUMN "hasTriggeredKycCheck" BOOLEAN DEFAULT false NOT NULL;

  INSERT INTO public.cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
  values ('accountKycCheck', 'UTC', '*/5 * * * * *', true, now(), now());
`,
    { raw: true },
  )
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('salesforce')

  return queryInterface.sequelize.query(
    `
  ALTER TABLE public.account DROP COLUMN "hasTriggeredKycCheck";
  DELETE FROM public.cron_schedule where name='accountKycCheck'
`,
    { raw: true },
  )
}
