import * as Sequelize from 'sequelize'

export async function up(queryInterface: Sequelize.QueryInterface) {
  await queryInterface.createTable('withdrawal_kinesis_coin_emission', {
    accountId: {
      type: Sequelize.UUID,
      references: {
        model: 'account',
        key: 'id',
      },
    },
    salesforceAccountId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    salesforcePlatformCredentialId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  })

  return queryInterface.sequelize.query(
    `
    CREATE TABLE public.salesforce (
      id SERIAL,
      type character varying(255) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
  );

  ALTER TABLE public.account ADD COLUMN "hasTriggeredKycCheck" BOOLEAN DEFAULT false NOT NULL;

  INSERT INTO public.cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
  values ('accountKycCheck', 'UTC', '*/5 * * * * *', true, now(), now());
`,
    { raw: true },
  )
}

export async function down(queryInterface: Sequelize.QueryInterface) {
  await queryInterface.dropTable('salesforce')

  return queryInterface.sequelize.query(
    `
  ALTER TABLE public.account DROP COLUMN "hasTriggeredKycCheck";
  DELETE FROM public.cron_schedule where name='accountKycCheck'
`,
    { raw: true },
  )
}
