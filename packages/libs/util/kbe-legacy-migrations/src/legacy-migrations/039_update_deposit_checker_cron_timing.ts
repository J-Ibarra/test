export function up(queryInterface) {
  return queryInterface.sequelize.query(
    `
    UPDATE cron_schedule SET cron = '*/30 * * * * *' WHERE name = 'depositChecker';
  `,
    { raw: true },
  )
}

export function down(queryInterface) {
  queryInterface.sequelize.query(
    `
    UPDATE cron_schedule SET cron = '*/7 * * * *' WHERE name = 'depositChecker';
  `,
    { raw: true },
  )
}
