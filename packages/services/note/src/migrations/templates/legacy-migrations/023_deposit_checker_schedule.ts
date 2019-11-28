export function up(queryInterface) {
  // NB: We are not enabling this job in this migration
  // Once we have the required ENV, we can enable this
  return queryInterface.sequelize.query(`
    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('depositChecker', 'UTC', '*/7 * * * * *', true, now(), now());
  `, { raw: true })
}

export function down(queryInterface) {
  queryInterface.sequelize.query(`
    delete from cron_schedule where name = 'depositChecker';
  `, { raw: true })
}
